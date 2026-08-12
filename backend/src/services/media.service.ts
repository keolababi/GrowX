import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

export async function listPodcasts(userId: string) {
  const podcasts = await prisma.podcast.findMany({
    orderBy: [{ listens: { _count: 'desc' } }, { createdAt: 'desc' }],
    include: {
      author: { include: { profile: { select: { displayName: true, avatarUrl: true } } } },
      episodes: { orderBy: { createdAt: 'desc' } },
      _count: { select: { listens: true } },
      listens: { where: { userId }, select: { id: true }, take: 1 },
    },
  });
  return {
    podcasts: podcasts.map(({ _count, listens, ...podcast }) => ({
      ...podcast,
      author: {
        id: podcast.author.id,
        displayName: podcast.author.profile?.displayName ?? null,
        avatarUrl: podcast.author.profile?.avatarUrl ?? null,
      },
      listenCount: _count.listens,
      listenedByMe: listens.length > 0,
    })),
  };
}

export async function recordPodcastListen(userId: string, podcastId: string) {
  const podcast = await prisma.podcast.findUnique({
    where: { id: podcastId },
    select: { id: true },
  });
  if (!podcast) throw new HttpError(404, 'Podcast олдсонгүй.');
  await prisma.podcastListen.upsert({
    where: { podcastId_userId: { podcastId, userId } },
    update: {},
    create: { podcastId, userId },
  });
  return {
    listened: true,
    listenCount: await prisma.podcastListen.count({ where: { podcastId } }),
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
      take: 100,
      include: { user: { select: reelAuthorSelect } },
    },
  }) as const;

function serializeReel(reel: {
  id: string;
  authorId: string;
  caption: string | null;
  videoUrl: string;
  shareCount: number;
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
    shareCount: reel.shareCount,
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
  const [reels, following] = await Promise.all([
    prisma.reel.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: reelInclude(viewerId),
    }),
    prisma.follow.findMany({ where: { followerId: viewerId }, select: { followingId: true } }),
  ]);
  const followingIds = new Set(following.map((row) => row.followingId));
  const now = Date.now();
  const ranked = reels.sort((a, b) => {
    const score = (reel: (typeof reels)[number]) => {
      const ageHours = Math.max(0, (now - reel.createdAt.getTime()) / 3_600_000);
      const relationshipBoost = followingIds.has(reel.authorId)
        ? 120
        : reel.authorId === viewerId
          ? 90
          : 0;
      const engagement = reel._count.likes * 3 + reel._count.comments * 5 + reel.shareCount * 4;
      return relationshipBoost + engagement + Math.max(0, 72 - ageHours);
    };
    return score(b) - score(a) || b.createdAt.getTime() - a.createdAt.getTime();
  });
  return { reels: ranked.slice(0, 50).map(serializeReel) };
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

export async function updateReel(userId: string, reelId: string, input: { caption?: string }) {
  const existing = await prisma.reel.findUnique({
    where: { id: reelId },
    select: { authorId: true },
  });
  if (!existing) throw new HttpError(404, 'Reel олдсонгүй.');
  if (existing.authorId !== userId)
    throw new HttpError(403, 'Зөвхөн өөрийн Reel-ийг засах боломжтой.');

  const reel = await prisma.reel.update({
    where: { id: reelId },
    data: { caption: input.caption },
    include: reelInclude(userId),
  });
  return { reel: serializeReel(reel) };
}

export async function deleteReel(userId: string, reelId: string) {
  const existing = await prisma.reel.findUnique({
    where: { id: reelId },
    select: { authorId: true },
  });
  if (!existing) throw new HttpError(404, 'Reel олдсонгүй.');
  if (existing.authorId !== userId)
    throw new HttpError(403, 'Зөвхөн өөрийн Reel-ийг устгах боломжтой.');
  await prisma.reel.delete({ where: { id: reelId } });
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

export async function listReelLikes(reelId: string) {
  await requireReel(reelId);
  const likes = await prisma.reelLike.findMany({
    where: { reelId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: reelAuthorSelect } },
  });
  return {
    users: likes.map((like) => ({
      id: like.user.id,
      email: like.user.email,
      displayName: like.user.profile?.displayName ?? null,
      avatarUrl: like.user.profile?.avatarUrl ?? null,
    })),
  };
}

export async function recordReelShare(reelId: string) {
  await requireReel(reelId);
  const reel = await prisma.reel.update({
    where: { id: reelId },
    data: { shareCount: { increment: 1 } },
    select: { shareCount: true },
  });
  return { shareCount: reel.shareCount };
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
