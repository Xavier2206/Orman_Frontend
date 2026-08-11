import { TestBed } from '@angular/core/testing';

import { DEVICE_ID_STORAGE_KEY, DeviceService } from './device.service';

describe('DeviceService', () => {
  let service: DeviceService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeviceService);
  });

  afterEach(() => localStorage.clear());

  it('should generate and persist one stable device identifier', () => {
    const firstDeviceId = service.getDeviceId();
    const secondDeviceId = service.getDeviceId();

    expect(firstDeviceId).toBeTruthy();
    expect(secondDeviceId).toBe(firstDeviceId);
    expect(localStorage.getItem(DEVICE_ID_STORAGE_KEY)).toBe(firstDeviceId);
  });

  it('should reuse an existing device identifier without storing authentication data', () => {
    localStorage.setItem(DEVICE_ID_STORAGE_KEY, 'existing-device-id');

    expect(service.getDeviceId()).toBe('existing-device-id');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('should create a concise non-invasive device name', () => {
    expect(service.getDeviceName()).toBeTruthy();
    expect(service.getDeviceName().length).toBeLessThanOrEqual(100);
  });
});
