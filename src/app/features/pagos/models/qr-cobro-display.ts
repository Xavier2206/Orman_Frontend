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

export function qrCobroDownloadFilename(
  codqr: number,
  blobType: string,
  responseType: string,
  originalName: string,
): string | null {
  const normalizedBlobType = blobType.split(';', 1)[0].trim().toLowerCase();
  const hasAuthoritativeBlobType =
    normalizedBlobType.length > 0 && normalizedBlobType !== 'application/octet-stream';
  const extension = hasAuthoritativeBlobType
    ? extensionFromContentType(normalizedBlobType)
    : (extensionFromContentType(responseType) ?? extensionFromOriginalName(originalName));

  return extension ? `orman-qr-cobro-${codqr}.${extension}` : null;
}

function extensionFromContentType(contentType: string): string | null {
  const normalizedType = contentType.split(';', 1)[0].trim().toLowerCase();

  if (!normalizedType || normalizedType === 'application/octet-stream') {
    return null;
  }

  if (!normalizedType.startsWith('image/')) {
    return null;
  }

  const knownExtensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/bmp': 'bmp',
    'image/x-ms-bmp': 'bmp',
    'image/tiff': 'tif',
    'image/x-tiff': 'tif',
    'image/svg+xml': 'svg',
    'image/x-icon': 'ico',
    'image/vnd.microsoft.icon': 'ico',
  };
  const knownExtension = knownExtensions[normalizedType];

  if (knownExtension) {
    return knownExtension;
  }

  const subtype = normalizedType.slice('image/'.length).replace(/^x-/, '');
  return /^[a-z0-9][a-z0-9-]{0,15}$/.test(subtype) ? subtype : null;
}

function extensionFromOriginalName(originalName: string): string | null {
  const match = /\.([a-z0-9]{2,8})$/i.exec(originalName.trim());

  if (!match) {
    return null;
  }

  const extension = match[1].toLowerCase();
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif', 'bmp', 'tif', 'tiff', 'svg', 'ico'].includes(
    extension,
  )
    ? extension
    : null;
}
