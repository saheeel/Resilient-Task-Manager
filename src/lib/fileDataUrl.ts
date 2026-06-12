const MAX_IMAGE_DIMENSION = 1600;
const COMPRESSED_IMAGE_QUALITY = 0.8;

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

const loadImageBitmap = async (file: File): Promise<ImageBitmap | HTMLImageElement> => {
  if ('createImageBitmap' in window) {
    return await createImageBitmap(file);
  }

  return await new Promise<HTMLImageElement>((resolve, reject) => {
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
};

const compressImageFile = async (file: File) => {
  const image = await loadImageBitmap(file);
  const sourceWidth = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const sourceHeight = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');

  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Failed to prepare image compression.');
  }

  context.drawImage(image as CanvasImageSource, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/webp', COMPRESSED_IMAGE_QUALITY);
  });

  if ('close' in image && typeof image.close === 'function') {
    image.close();
  }

  if (!blob) {
    throw new Error('Failed to compress image.');
  }

  return blob.size < file.size ? blob : file;
};

export const readFileAsDataUrl = async (file: File) => {
  const shouldCompress =
    file.type.startsWith('image/') &&
    file.type !== 'image/gif' &&
    file.type !== 'image/svg+xml';

  const optimizedFile = shouldCompress ? await compressImageFile(file) : file;
  return await readBlobAsDataUrl(optimizedFile);
};
