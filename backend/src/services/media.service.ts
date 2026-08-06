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

const reelAuthorSelect = {
  id: true,
  email: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

const reelInclude = (viewerId: string) =>
  ({
    author: { select: reelAuthorSelect },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId: viewerId }, select: { id: true }, take: 1 },
    comments: {
      orderBy: { createdAt: 'asc' as const },
      take: 3,
      include: { user: { select: reelAuthorSelect } },
    },
  }) as const;

function serializeReel(reel: {
  id: string;
  authorId: string;
  caption: string | null;
  videoUrl: string;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    email: string;
    profile: { displayName: string | null; avatarUrl: string | null } | null;
  };
  _count: { likes: number; comments: number };
  likes: { id: string }[];
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    user: {
      id: string;
      email: string;
      profile: { displayName: string | null; avatarUrl: string | null } | null;
    };
  }>;
}) {
  return {
    id: reel.id,
    authorId: reel.authorId,
    caption: reel.caption,
    videoUrl: reel.videoUrl,
    createdAt: reel.createdAt,
    updatedAt: reel.updatedAt,
    author: {
      id: reel.author.id,
      email: reel.author.email,
      displayName: reel.author.profile?.displayName ?? null,
      avatarUrl: reel.author.profile?.avatarUrl ?? null,
    },
    likeCount: reel._count.likes,
    commentCount: reel._count.comments,
    likedByMe: reel.likes.length > 0,
    comments: reel.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        email: comment.user.email,
        displayName: comment.user.profile?.displayName ?? null,
        avatarUrl: comment.user.profile?.avatarUrl ?? null,
      },
    })),
  };
}

export async function listReels(viewerId: string) {
  const reels = await prisma.reel.findMany({
    orderBy: { createdAt: 'desc' },
    include: reelInclude(viewerId),
  });
  return { reels: reels.map(serializeReel) };
}

export async function listMyReels(viewerId: string) {
  const reels = await prisma.reel.findMany({
    where: { authorId: viewerId },
    orderBy: { createdAt: 'desc' },
    include: reelInclude(viewerId),
  });
  return { reels: reels.map(serializeReel) };
}

export async function createReel(userId: string, input: { caption?: string; videoUrl: string }) {
  const reel = await prisma.reel.create({
    data: { authorId: userId, caption: input.caption, videoUrl: input.videoUrl },
    include: reelInclude(userId),
  });
  return { reel: serializeReel(reel) };
}

async function requireReel(reelId: string) {
  const reel = await prisma.reel.findUnique({ where: { id: reelId }, select: { id: true } });
  if (!reel) throw new HttpError(404, 'Reel олдсонгүй.');
  return reel;
}

export async function toggleReelLike(userId: string, reelId: string) {
  await requireReel(reelId);
  const existing = await prisma.reelLike.findUnique({
    where: { userId_reelId: { userId, reelId } },
  });
  if (existing) {
    await prisma.reelLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.reelLike.create({ data: { userId, reelId } });
  }
  const likeCount = await prisma.reelLike.count({ where: { reelId } });
  return { liked: !existing, likeCount };
}

export async function addReelComment(userId: string, reelId: string, content: string) {
  await requireReel(reelId);
  const comment = await prisma.reelComment.create({
    data: { userId, reelId, content },
    include: { user: { select: reelAuthorSelect } },
  });
  return {
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        email: comment.user.email,
        displayName: comment.user.profile?.displayName ?? null,
        avatarUrl: comment.user.profile?.avatarUrl ?? null,
      },
    },
  };
}

export async function updateReelComment(
  userId: string,
  reelId: string,
  commentId: string,
  content: string,
) {
  await requireReel(reelId);
  const existing = await prisma.reelComment.findUnique({
    where: { id: commentId },
    select: { userId: true, reelId: true },
  });
  if (!existing || existing.reelId !== reelId) throw new HttpError(404, 'Сэтгэгдэл олдсонгүй.');
  if (existing.userId !== userId) {
    throw new HttpError(403, 'Зөвхөн өөрийн сэтгэгдлийг засах боломжтой.');
  }

  const comment = await prisma.reelComment.update({
    where: { id: commentId },
    data: { content },
    include: { user: { select: reelAuthorSelect } },
  });
  return {
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: {
        id: comment.user.id,
        email: comment.user.email,
        displayName: comment.user.profile?.displayName ?? null,
        avatarUrl: comment.user.profile?.avatarUrl ?? null,
      },
    },
  };
}

export async function deleteReelComment(userId: string, reelId: string, commentId: string) {
  await requireReel(reelId);
  const comment = await prisma.reelComment.findUnique({
    where: { id: commentId },
    select: { userId: true, reelId: true },
  });
  if (!comment || comment.reelId !== reelId) throw new HttpError(404, 'Сэтгэгдэл олдсонгүй.');
  if (comment.userId !== userId) {
    throw new HttpError(403, 'Энэ сэтгэгдлийг устгах эрхгүй байна.');
  }
  await prisma.reelComment.delete({ where: { id: commentId } });
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
