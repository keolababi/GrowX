import { upload } from '@vercel/blob/client';
import { Platform } from 'react-native';
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

  // fetch(...).blob() on native returns a real React Native Blob backed by a
  // native-side reference (no JS-side copy), which is what RN's XHR/fetch
  // networking actually knows how to send.
  const body = asset.file ?? (await (await fetch(asset.uri)).blob());

  const safeName = asset.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  onProgress?.(0);
  const result = await upload(`${kind}/${Date.now()}-${safeName}`, body, {
    access: 'public',
    contentType: asset.mimeType,
    handleUploadUrl: `${API_URL}/uploads`,
    clientPayload: JSON.stringify({ accessToken, kind }),
    // @vercel/blob's multipart path chunks the body via Blob.stream() and
    // rebuilds parts with `new Blob([arrayBufferChunk])`. React Native's Blob
    // polyfill implements neither -- it has no .stream() and its constructor
    // explicitly rejects ArrayBuffer/TypedArray parts -- so multipart silently
    // corrupts native uploads (a real Blob, but the wrong/undersized bytes)
    // while the browser's real Blob supports both fine.
    multipart: Platform.OS === 'web' && kind !== 'image',
    // Passing onUploadProgress makes the SDK pick a streaming request path
    // (fetch+ReadableStream, or its own Blob.stream() chunking) to measure
    // bytes sent. React Native's Blob has no .stream(), so on native that
    // path throws "value.stream is not a function" before anything uploads.
    // Native just jumps straight from 0 to 100 instead of granular progress.
    ...(Platform.OS === 'web'
      ? { onUploadProgress: ({ percentage }: { percentage: number }) => onProgress?.(percentage) }
      : {}),
  });
  onProgress?.(100);
  return result;
}
