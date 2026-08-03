import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { LocalUploadAsset } from './blob';

type PickedImage = {
  uri: string;
  width: number;
  fileName?: string | null;
};

const MAX_UPLOAD_WIDTH = 1600;

export async function optimizePickedImage(image: PickedImage): Promise<LocalUploadAsset> {
  const actions = image.width > MAX_UPLOAD_WIDTH ? [{ resize: { width: MAX_UPLOAD_WIDTH } }] : [];
  const optimized = await manipulateAsync(image.uri, actions, {
    compress: 0.75,
    format: SaveFormat.JPEG,
  });
  const baseName = (image.fileName || `image-${Date.now()}`).replace(/\.[^.]+$/, '');
  return {
    uri: optimized.uri,
    name: `${baseName}.jpg`,
    mimeType: 'image/jpeg',
  };
}
