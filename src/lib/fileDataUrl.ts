const MAX_IMAGE_DIMENSION = 960;
const MIN_IMAGE_DIMENSION = 320;
const START_QUALITY = 0.72;
const MIN_QUALITY = 0.24;
const QUALITY_STEP = 0.08;
const SCALE_STEP = 0.76;
const TARGET_IMAGE_BYTES = 180 * 1024;

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read file as data URL.'));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Failed to read file.'));
    };

    reader.readAsDataURL(blob);
  });

const loadImageElement = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to decode image.'));
    };

    image.src = objectUrl;
  });

const loadImageBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  try {
    return await loadImageElement(file);
  } catch (elementError) {
    if ('createImageBitmap' in window) {
      try {
        return await createImageBitmap(file);
      } catch {
        throw elementError;
      }
    }
    throw elementError;
  }
};

const exportCanvasBlob = async (canvas: HTMLCanvasElement, quality: number) => {
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, type, quality);
    });

  return (await toBlob('image/webp')) ?? (await toBlob('image/jpeg'));
};

export const compressImageFile = async (file: File) => {
  const image = await loadImageBitmap(file);
  const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const initialScale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight));
  let width = Math.max(1, Math.round(sourceWidth * initialScale));
  let height = Math.max(1, Math.round(sourceHeight * initialScale));
  let quality = START_QUALITY;
  let bestBlob: Blob | null = null;
  const canvas = document.createElement('canvas');

  for (let attempt = 0; attempt < 14; attempt += 1) {
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Failed to prepare image compression.');
    }

    context.drawImage(image as CanvasImageSource, 0, 0, width, height);

    const blob = await exportCanvasBlob(canvas, quality);
    if (!blob) {
      throw new Error('Failed to compress image.');
    }

    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }

    if (blob.size <= TARGET_IMAGE_BYTES) {
      if ('close' in image && typeof image.close === 'function') {
        image.close();
      }
      canvas.width = 0;
      canvas.height = 0;
      return blob;
    }

    if (quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - QUALITY_STEP);
      continue;
    }

    if (Math.max(width, height) > MIN_IMAGE_DIMENSION) {
      width = Math.max(1, Math.round(width * SCALE_STEP));
      height = Math.max(1, Math.round(height * SCALE_STEP));
      quality = START_QUALITY;
      continue;
    }

    break;
  }

  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }
  
  canvas.width = 0;
  canvas.height = 0;

  return bestBlob && bestBlob.size < file.size ? bestBlob : file;
};

export const readFileAsDataUrl = async (file: File) => {
  const shouldCompress =
    file.type.startsWith('image/') &&
    file.type !== 'image/gif' &&
    file.type !== 'image/svg+xml';

  if (!shouldCompress) {
    return await readBlobAsDataUrl(file);
  }

  try {
    const optimizedFile = await compressImageFile(file);
    return await readBlobAsDataUrl(optimizedFile);
  } catch {
    return await readBlobAsDataUrl(file);
  }
};
