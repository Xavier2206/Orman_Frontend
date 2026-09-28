import type { QrCobroEstado } from './qr-cobro.model';

export function formatQrCobroDate(value: string): string {
  const date = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return value;
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function formatQrCobroDateTime(value: string): string {
  const [date, time] = value.split('T');
  return time ? `${formatQrCobroDate(date)} ${time.slice(0, 5)}` : formatQrCobroDate(date);
}

export function qrCobroStateLabel(state: QrCobroEstado): string {
  return state === 'ACTIVO' ? 'Activo' : 'Inactivo';
}
