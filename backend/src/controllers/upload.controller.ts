import type { Request, Response } from 'express';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

type UploadKind = 'image' | 'video' | 'audio';
const allowedTypes: Record<UploadKind, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: [
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/x-m4a',
    'audio/aac',
    'audio/ogg',
    'audio/webm',
  ],
};

function authenticateClientPayload(clientPayload: string | null | undefined) {
  if (!clientPayload) throw new HttpError(401, 'Upload authentication required.');
  const parsed = JSON.parse(clientPayload) as { accessToken?: string; kind?: UploadKind };
  if (!parsed.accessToken || !parsed.kind || !allowedTypes[parsed.kind]) {
    throw new HttpError(400, 'Invalid upload request.');
  }
  const payload = jwt.verify(parsed.accessToken, env.JWT_SECRET);
  if (typeof payload === 'string') throw new HttpError(401, 'Invalid access token.');
  const userId = typeof payload.userId === 'string' ? payload.userId : payload.sub;
  if (!userId) throw new HttpError(401, 'Invalid access token.');
  return { userId, kind: parsed.kind };
}

export async function upload(req: Request, res: Response): Promise<void> {
  if (!env.BLOB_READ_WRITE_TOKEN) {
    throw new HttpError(503, 'Vercel Blob тохируулагдаагүй байна.');
  }
  const body = req.body as HandleUploadBody;
  const result = await handleUpload({
    body,
    request: new Request(`${req.protocol}://${req.get('host')}${req.originalUrl}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    token: env.BLOB_READ_WRITE_TOKEN,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const auth = authenticateClientPayload(clientPayload);
      return {
        allowedContentTypes: allowedTypes[auth.kind],
        addRandomSuffix: true,
        tokenPayload: JSON.stringify({ userId: auth.userId, kind: auth.kind, pathname }),
      };
    },
    onUploadCompleted: async () => {},
  });
  res.status(200).json(result);
}
