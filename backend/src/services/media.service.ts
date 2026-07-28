import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

export async function listPodcasts() {
  const podcasts = await prisma.podcast.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      episodes: { orderBy: { createdAt: 'desc' } },
    },
  });
  return {
    podcasts: podcasts.map((podcast) => ({
      ...podcast,
      author: {
        id: podcast.author.id,
        displayName: podcast.author.profile?.displayName ?? null,
        avatarUrl: podcast.author.profile?.avatarUrl ?? null,
      },
    })),
  };
}

export async function createPodcast(
  userId: string,
  input: {
    title: string;
    description?: string;
    coverUrl: string;
    audioUrl: string;
    durationSec?: number;
  },
) {
  const podcast = await prisma.podcast.create({
    data: {
      authorId: userId,
      title: input.title,
      description: input.description,
      coverUrl: input.coverUrl,
      publishedAt: new Date(),
      episodes: {
        create: {
          title: input.title,
          description: input.description,
          audioUrl: input.audioUrl,
          durationSec: input.durationSec,
          publishedAt: new Date(),
        },
      },
    },
    include: { episodes: true },
  });
  return { podcast };
}

export async function listReels() {
  return {
    reels: await prisma.reel.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    }),
  };
}

export async function createReel(userId: string, input: { caption?: string; videoUrl: string }) {
  const reel = await prisma.reel.create({
    data: { authorId: userId, caption: input.caption, videoUrl: input.videoUrl },
  });
  return { reel };
}

export async function deletePodcast(userId: string, podcastId: string) {
  const podcast = await prisma.podcast.findUnique({
    where: { id: podcastId },
    select: { authorId: true },
  });
  if (!podcast) throw new HttpError(404, 'Podcast олдсонгүй.');
  if (podcast.authorId !== userId) throw new HttpError(403, 'Устгах эрхгүй байна.');
  await prisma.podcast.delete({ where: { id: podcastId } });
}
