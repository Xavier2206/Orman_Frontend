import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Client, ReconnectionTimeMode, type IMessage } from '@stomp/stompjs';
import { Subject, firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/auth/auth.service';
import {
  NOTIFICACIONES_STOMP_DESTINATION,
  NOTIFICACIONES_STOMP_URL,
} from './notificacion-realtime.constants';

export interface NotificacionRealtimeEvent {
  readonly codnot: number;
  readonly tipo: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionRealtimeService {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly eventSubject = new Subject<NotificacionRealtimeEvent>();
  private readonly connectedSubject = new Subject<void>();

  readonly events$ = this.eventSubject.asObservable();
  readonly connected$ = this.connectedSubject.asObservable();

  private client: Client | null = null;
  private requestedToken: string | null = null;
  private blockedToken: string | null = null;
  private sessionEnding = false;
  private refreshAttemptedBeforeConnection = false;
  private lifecycleVersion = 0;
  private lifecycleQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.destroyRef.onDestroy(() => this.disconnect());
  }

  syncWithSession(accessToken: string | null): void {
    if (accessToken !== this.auth.accessToken()) {
      return;
    }

    if (!accessToken) {
      this.sessionEnding = false;
      this.blockedToken = null;
      this.refreshAttemptedBeforeConnection = false;
      this.disconnect();
      return;
    }

    if (this.sessionEnding || this.blockedToken === accessToken) {
      return;
    }

    if (this.requestedToken === accessToken) {
      return;
    }

    this.requestedToken = accessToken;
    const previousClient = this.client;
    this.client = null;
    const lifecycleVersion = ++this.lifecycleVersion;

    this.enqueueLifecycle(async () => {
      await this.deactivateClient(previousClient);

      if (!this.isCurrentConnection(lifecycleVersion, accessToken)) {
        return;
      }

      const client = this.createClient(accessToken);
      this.client = client;
      client.activate();
    });
  }

  endSession(): void {
    this.sessionEnding = true;
    this.disconnect();
  }

  disconnect(): void {
    const previousClient = this.client;
    this.client = null;
    this.requestedToken = null;
    this.lifecycleVersion += 1;

    if (previousClient) {
      this.enqueueLifecycle(async () => {
        await this.deactivateClient(previousClient);
      });
    }
  }

  private createClient(accessToken: string): Client {
    let tokenForConnection = accessToken;
    let client: Client;

    client = new Client({
      brokerURL: NOTIFICACIONES_STOMP_URL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 1_000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      maxReconnectDelay: 10_000,
      connectionTimeout: 10_000,
      debug: () => undefined,
      beforeConnect: async (activeClient) => {
        const latestToken = await firstValueFrom(this.auth.getAccessTokenAfterPendingRefresh());

        if (!latestToken || this.sessionEnding) {
          activeClient.connectHeaders = {};
          void activeClient.deactivate({ force: true });
          return;
        }

        tokenForConnection = latestToken;
        activeClient.connectHeaders = { Authorization: `Bearer ${latestToken}` };
      },
      onConnect: () => {
        if (this.client !== client) {
          return;
        }

        this.refreshAttemptedBeforeConnection = false;
        this.blockedToken = null;
        client.subscribe(NOTIFICACIONES_STOMP_DESTINATION, (message) => {
          const event = this.parseEvent(message);

          if (event) {
            this.eventSubject.next(event);
          }
        });
        this.connectedSubject.next();
      },
      onStompError: () => this.handleStompError(client, () => tokenForConnection),
    });

    return client;
  }

  private handleStompError(client: Client, getFailedToken: () => string): void {
    if (this.client !== client) {
      return;
    }

    const failedToken = getFailedToken();
    this.disconnect();

    if (this.refreshAttemptedBeforeConnection) {
      this.blockedToken = failedToken;
      return;
    }

    this.refreshAttemptedBeforeConnection = true;
    this.auth
      .refreshAccessToken()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const refreshedToken = this.auth.accessToken();

          if (refreshedToken && refreshedToken !== failedToken) {
            this.syncWithSession(refreshedToken);
            return;
          }

          if (refreshedToken === failedToken) {
            this.blockedToken = failedToken;
          }
        },
        error: () => undefined,
      });
  }

  private parseEvent(message: IMessage): NotificacionRealtimeEvent | null {
    try {
      const payload: unknown = JSON.parse(message.body);

      if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        return null;
      }

      const eventPayload = payload as Record<string, unknown>;

      if (
        typeof eventPayload['codnot'] !== 'number' ||
        !Number.isSafeInteger(eventPayload['codnot']) ||
        eventPayload['codnot'] <= 0 ||
        typeof eventPayload['tipo'] !== 'string' ||
        eventPayload['tipo'].trim().length === 0
      ) {
        return null;
      }

      return {
        codnot: eventPayload['codnot'],
        tipo: eventPayload['tipo'],
      };
    } catch {
      return null;
    }
  }

  private enqueueLifecycle(operation: () => Promise<void>): void {
    this.lifecycleQueue = this.lifecycleQueue.then(operation).catch(() => undefined);
  }

  private async deactivateClient(client: Client | null): Promise<void> {
    if (!client) {
      return;
    }

    await client.deactivate({ force: true }).catch(() => undefined);
  }

  private isCurrentConnection(lifecycleVersion: number, accessToken: string): boolean {
    return (
      lifecycleVersion === this.lifecycleVersion &&
      this.requestedToken === accessToken &&
      this.auth.accessToken() === accessToken &&
      !this.sessionEnding
    );
  }
}
