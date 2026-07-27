import { upload } from '@vercel/blob/client';
import { API_URL } from '@/constants/config';
import { tokenStorage } from './token';

export type LocalUploadAsset = {
  uri: string;
  name: string;
  mimeType: string;
  file?: Blob;
};

export async function uploadMedia(
  asset: LocalUploadAsset,
  kind: 'image' | 'video' | 'audio',
  onProgress?: (percentage: number) => void,
) {
  const accessToken = await tokenStorage.get();
  if (!accessToken) throw new Error('Нэвтрэх шаардлагатай.');

  const body = asset.file ?? (await (await fetch(asset.uri)).blob());
  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  return upload(`${kind}/${Date.now()}-${safeName}`, body, {
    access: 'public',
    contentType: asset.mimeType,
    handleUploadUrl: `${API_URL}/uploads`,
    clientPayload: JSON.stringify({ accessToken, kind }),
    multipart: kind !== 'image',
    onUploadProgress: ({ percentage }) => onProgress?.(percentage),
  });
}
