import { describe, expect, it } from 'vitest';

import { qrCobroDownloadFilename } from './qr-cobro-display';

describe('qrCobroDownloadFilename', () => {
  it('uses the downloaded Blob MIME type and maps JPEG to a .jpg extension', () => {
    expect(qrCobroDownloadFilename(18, 'image/jpeg; charset=binary', 'image/png', 'qr.png')).toBe(
      'orman-qr-cobro-18.jpg',
    );
  });

  it('uses the response MIME type when the Blob does not declare one', () => {
    expect(qrCobroDownloadFilename(18, '', 'image/png', 'qr.jpg')).toBe('orman-qr-cobro-18.png');
  });

  it('uses a known image extension from the original name as a final fallback', () => {
    expect(qrCobroDownloadFilename(18, 'application/octet-stream', '', 'qr banco.jpeg')).toBe(
      'orman-qr-cobro-18.jpeg',
    );
  });

  it('does not relabel a Blob whose declared type is not an image', () => {
    expect(qrCobroDownloadFilename(18, 'application/pdf', 'image/png', 'qr.png')).toBeNull();
  });

  it('does not construct a filename when no image format can be determined', () => {
    expect(qrCobroDownloadFilename(18, '', '', 'qr.dat')).toBeNull();
  });
});
