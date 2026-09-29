import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  Client,
  type IFrame,
  type IMessage,
  ReconnectionTimeMode,
  type StompSubscription,
} from '@stomp/stompjs';

import { authInterceptor } from '../../../core/auth/auth.interceptor';
import { AuthService } from '../../../core/auth/auth.service';
import {
  NotificacionRealtimeEvent,
  NotificacionRealtimeService,
} from './notificacion-realtime.service';

interface MockStompSubscription {
  readonly destination: string;
  readonly callback: (message: IMessage) => void;
}

describe('NotificacionRealtimeService', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  let realtime: NotificacionRealtimeService;
  let clients: Client[];
  let subscriptions: WeakMap<Client, MockStompSubscription[]>;
  let deactivatedClients: Set<Client>;
  let deactivateSpy: ReturnType<typeof vi.spyOn>;
  let subscribeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    clients = [];
    subscriptions = new WeakMap();
    deactivatedClients = new Set();

    vi.spyOn(Client.prototype, 'activate').mockImplementation(function (this: Client): void {
      clients.push(this);
    });
    deactivateSpy = vi.spyOn(Client.prototype, 'deactivate').mockImplementation(function (
      this: Client,
    ): Promise<void> {
      deactivatedClients.add(this);
      return Promise.resolve();
    });
    subscribeSpy = vi.spyOn(Client.prototype, 'subscribe').mockImplementation(function (
      this: Client,
      destination: string,
      callback: (message: IMessage) => void,
    ): StompSubscription {
      const clientSubscriptions = subscriptions.get(this) ?? [];
      clientSubscriptions.push({ destination, callback });
      subscriptions.set(this, clientSubscriptions);

      return {
        id: 'mock-subscription',
        unsubscribe: vi.fn(),
      } as unknown as StompSubscription;
    });

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    realtime = TestBed.inject(NotificacionRealtimeService);
  });

  afterEach(async () => {
    try {
      realtime.disconnect();
      auth.clearSession();
      await vi.waitFor(() => {
        for (const client of clients) {
          expect(deactivatedClients.has(client)).toBe(true);
        }
      });
      http.verify();
    } finally {
      vi.restoreAllMocks();
    }
  });

  function authenticate(accessToken = 'access-token'): void {
    auth.login('propietaria', 'password-demo').subscribe();
    http.expectOne('/api/v1/auth/login').flush({
      status: 'AUTHENTICATED',
      login: 'propietaria',
      codper: 10,
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
  }

  function clientAt(index = 0): Client {
    return clients[index] as Client;
  }

  async function waitForClients(count: number): Promise<void> {
    await vi.waitFor(() => expect(clients).toHaveLength(count));
  }

  function subscriptionsFor(client: Client): MockStompSubscription[] {
    return subscriptions.get(client) ?? [];
  }

  function messageWithBody(body: string): IMessage {
    return {
      ack: () => undefined,
      binaryBody: new Uint8Array(),
      body,
      command: 'MESSAGE',
      headers: {},
      isBinaryBody: false,
      nack: () => undefined,
    };
  }

  it('does not connect without an authenticated access token', () => {
    realtime.syncWithSession(auth.accessToken());

    expect(clients).toHaveLength(0);
  });

  it('connects once with the local endpoint, Bearer CONNECT header, and private destination', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);

    const client = clientAt();
    await client.beforeConnect(client);
    client.onConnect({} as IFrame);

    expect(client.brokerURL).toBe('ws://localhost:9090/ws');
    expect(client.connectHeaders).toEqual({ Authorization: 'Bearer access-token' });
    expect(subscribeSpy).toHaveBeenCalledOnce();
    expect(subscriptionsFor(client)[0].destination).toBe('/user/queue/notificaciones');
    expect(client.reconnectTimeMode).toBe(ReconnectionTimeMode.EXPONENTIAL);
    expect(client.reconnectDelay).toBe(1_000);
    expect(client.maxReconnectDelay).toBe(10_000);
  });

  it('waits for an in-flight Auth refresh before sending STOMP CONNECT', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    auth.refreshAccessToken().subscribe();
    const refresh = http.expectOne('/api/v1/auth/refresh');
    const client = clientAt();
    let connectPreparationFinished = false;
    const connectPreparation = (async () => {
      await client.beforeConnect(client);
      connectPreparationFinished = true;
    })();

    await Promise.resolve();
    expect(connectPreparationFinished).toBe(false);
    refresh.flush({
      status: 'AUTHENTICATED',
      login: 'propietaria',
      codper: 10,
      accessToken: 'refreshed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    await connectPreparation;

    expect(client.connectHeaders).toEqual({
      Authorization: 'Bearer refreshed-token',
    });
  });

  it('emits valid events and ignores malformed STOMP payloads', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    const client = clientAt();
    client.onConnect({} as IFrame);
    const received: NotificacionRealtimeEvent[] = [];
    const subscription = realtime.events$.subscribe((event) => received.push(event));
    const messageHandler = subscriptionsFor(client)[0].callback;

    messageHandler(messageWithBody('{"codnot":73,"tipo":"COMPROBANTE_RECIBIDO"}'));
    messageHandler(messageWithBody('{invalid json'));
    messageHandler(messageWithBody('{"codnot":0,"tipo":"PAGO_CONFIRMADO"}'));
    messageHandler(messageWithBody('{"codnot":74,"tipo":"   "}'));
    subscription.unsubscribe();

    expect(received).toEqual([{ codnot: 73, tipo: 'COMPROBANTE_RECIBIDO' }]);
  });

  it('subscribes again and signals REST recovery after each successful reconnect', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    const client = clientAt();
    let connectionCount = 0;
    const subscription = realtime.connected$.subscribe(() => {
      connectionCount += 1;
    });

    client.onConnect({} as IFrame);
    client.onConnect({} as IFrame);
    subscription.unsubscribe();

    expect(subscribeSpy).toHaveBeenCalledTimes(2);
    expect(connectionCount).toBe(2);
  });

  it('reconnects once with the refreshed token after a STOMP broker error', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    clientAt().onStompError({} as IFrame);

    http.expectOne('/api/v1/auth/refresh').flush({
      status: 'AUTHENTICATED',
      login: 'propietaria',
      codper: 10,
      accessToken: 'refreshed-token',
      tokenType: 'Bearer',
      expiresIn: 900,
      sid: 'session-id',
    });
    await waitForClients(2);

    const refreshedClient = clientAt(1);
    await refreshedClient.beforeConnect(refreshedClient);
    expect(refreshedClient.connectHeaders).toEqual({
      Authorization: 'Bearer refreshed-token',
    });
    expect(deactivatedClients.has(clientAt())).toBe(true);
  });

  it('disconnects at session end and does not reconnect until a new session exists', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    const client = clientAt();

    realtime.endSession();
    realtime.syncWithSession(auth.accessToken());
    await vi.waitFor(() => expect(client.deactivate).toHaveBeenCalledOnce());

    expect(deactivateSpy).toHaveBeenCalledOnce();
    expect(clients).toHaveLength(1);
  });

  it('does not write STOMP debug messages that could contain credentials', async () => {
    authenticate();
    realtime.syncWithSession(auth.accessToken());
    await waitForClients(1);
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined);

    clientAt().debug('Authorization: Bearer access-token');

    expect(log).not.toHaveBeenCalled();
  });
});
