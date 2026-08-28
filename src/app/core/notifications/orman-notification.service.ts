import { Injectable } from '@angular/core';
import { toast } from 'ngx-sonner';

export type OrmanNotificationId = string | number;

export interface OrmanNotificationOptions {
  readonly description?: string;
  readonly dismissible?: boolean;
  readonly id?: OrmanNotificationId;
  readonly persistent?: boolean;
}

@Injectable({ providedIn: 'root' })
export class OrmanNotificationService {
  success(message: string, options?: OrmanNotificationOptions): OrmanNotificationId {
    return toast.success(message, this.toSonnerOptions(options, 5000, false, false));
  }

  info(message: string, options?: OrmanNotificationOptions): OrmanNotificationId {
    return toast.info(message, this.toSonnerOptions(options, 6000, false, false));
  }

  warning(message: string, options?: OrmanNotificationOptions): OrmanNotificationId {
    return toast.warning(message, this.toSonnerOptions(options, 6000, true, true));
  }

  error(message: string, options?: OrmanNotificationOptions): OrmanNotificationId {
    return toast.error(message, this.toSonnerOptions(options, 6000, true, true));
  }

  dismiss(id?: OrmanNotificationId): void {
    toast.dismiss(id);
  }

  private toSonnerOptions(
    options: OrmanNotificationOptions | undefined,
    duration: number,
    important: boolean,
    persistentByDefault: boolean,
  ): {
    readonly closeButton: true;
    readonly description?: string;
    readonly dismissible?: boolean;
    readonly duration: number;
    readonly id?: OrmanNotificationId;
    readonly important: boolean;
  } {
    const persistent = options?.persistent ?? persistentByDefault;

    return {
      closeButton: true,
      description: options?.description,
      dismissible: options?.dismissible,
      duration: persistent ? Number.POSITIVE_INFINITY : duration,
      id: options?.id,
      important,
    };
  }
}
