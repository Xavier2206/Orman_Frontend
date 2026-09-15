export type UnidadPdfImageFormat = 'JPEG' | 'PNG';

export interface UnidadPdfImage {
  readonly dataUrl: string;
  readonly format: UnidadPdfImageFormat;
}

const PHOTO_IMAGE_RATIO = 16 / 9;
const PHOTO_IMAGE_CANVAS_WIDTH = 1200;

export async function prepareUnidadPdfImage(source: string): Promise<UnidadPdfImage | null> {
  try {
    const dataUrl = await resolvePhotoDataUrl(source);

    if (!dataUrl) {
      return null;
    }

    const directImage: UnidadPdfImage = {
      dataUrl,
      format: imageFormat(dataUrl),
    };
    const canvas = createPhotoCanvas();

    if (!canvas || typeof Image === 'undefined') {
      return directImage;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return directImage;
    }

    const image = await loadImage(dataUrl);
    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;

    if (!sourceWidth || !sourceHeight) {
      return directImage;
    }

    const sourceRatio = sourceWidth / sourceHeight;
    let cropWidth = sourceWidth;
    let cropHeight = sourceHeight;
    let cropX = 0;
    let cropY = 0;

    if (sourceRatio > PHOTO_IMAGE_RATIO) {
      cropWidth = sourceHeight * PHOTO_IMAGE_RATIO;
      cropX = (sourceWidth - cropWidth) / 2;
    } else {
      cropHeight = sourceWidth / PHOTO_IMAGE_RATIO;
      cropY = (sourceHeight - cropHeight) / 2;
    }

    context.fillStyle = '#f4f6f8';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    return { dataUrl: canvas.toDataURL('image/jpeg', 0.84), format: 'JPEG' };
  } catch {
    return null;
  }
}

function createPhotoCanvas(): HTMLCanvasElement | null {
  if (typeof document === 'undefined') {
    return null;
  }

  try {
    const canvas = document.createElement('canvas');
    canvas.width = PHOTO_IMAGE_CANVAS_WIDTH;
    canvas.height = Math.round(PHOTO_IMAGE_CANVAS_WIDTH / PHOTO_IMAGE_RATIO);

    if (!canvas.getContext('2d')) {
      return null;
    }

    return canvas;
  } catch {
    return null;
  }
}

async function resolvePhotoDataUrl(source: string): Promise<string | null> {
  if (source.startsWith('data:')) {
    return source;
  }

  if (typeof fetch === 'undefined') {
    return null;
  }

  const response = await fetch(source);

  if (!response.ok) {
    return null;
  }

  return blobToDataUrl(await response.blob());
}

function imageFormat(dataUrl: string): UnidadPdfImageFormat {
  return /^data:image\/png(?:;|,)/i.test(dataUrl) ? 'PNG' : 'JPEG';
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No fue posible preparar la fotografía para el PDF.'));
    image.src = source;
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('No fue posible leer la fotografía para el PDF.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('No fue posible leer la fotografía.'));
    reader.readAsDataURL(blob);
  });
}
