import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

export const DEVICE_ID_STORAGE_KEY = 'orman-device-id';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  private readonly document = inject(DOCUMENT);
  private generatedDeviceId: string | null = null;

  getDeviceId(): string {
    const storedDeviceId = this.readDeviceId();

    if (storedDeviceId) {
      return storedDeviceId;
    }

    const deviceId = this.generatedDeviceId ?? this.createDeviceId();
    this.generatedDeviceId = deviceId;

    try {
      this.document.defaultView?.localStorage.setItem(DEVICE_ID_STORAGE_KEY, deviceId);
    } catch {
      // El backend recibirá un identificador estable mientras la página permanezca abierta.
    }

    return deviceId;
  }

  getDeviceName(): string {
    const userAgent = this.document.defaultView?.navigator.userAgent ?? '';
    const platform = this.getPlatform(userAgent);
    const browser = this.getBrowser(userAgent);

    return `${browser} ${platform}`.slice(0, 100);
  }

  private readDeviceId(): string | null {
    try {
      const value = this.document.defaultView?.localStorage.getItem(DEVICE_ID_STORAGE_KEY) ?? null;
      return value && value.length <= 100 ? value : null;
    } catch {
      return null;
    }
  }

  private createDeviceId(): string {
    const crypto = this.document.defaultView?.crypto;

    if (typeof crypto?.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `web-${Date.now()}-${Math.random().toString(36).slice(2, 14)}`;
  }

  private getBrowser(userAgent: string): string {
    if (/Firefox\//i.test(userAgent)) {
      return 'Firefox';
    }

    if (/Edg\//i.test(userAgent)) {
      return 'Edge';
    }

    if (/Chrome\//i.test(userAgent) || /CriOS/i.test(userAgent)) {
      return 'Chrome';
    }

    if (/Safari\//i.test(userAgent)) {
      return 'Safari';
    }

    return 'Navegador';
  }

  private getPlatform(userAgent: string): string {
    if (/Windows/i.test(userAgent)) {
      return 'Windows';
    }

    if (/Macintosh|Mac OS X/i.test(userAgent)) {
      return 'macOS';
    }

    if (/Android/i.test(userAgent)) {
      return 'Android';
    }

    if (/iPhone|iPad|iPod/i.test(userAgent)) {
      return 'iOS';
    }

    if (/Linux/i.test(userAgent)) {
      return 'Linux';
    }

    return 'Web';
  }
}
