import type { AccountType } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const profileSelect = {
  id: true,
  email: true,
  profile: {
    select: {
      displayName: true,
      bio: true,
      avatarUrl: true,
      company: true,
      accountType: true,
      isMentor: true,
      coverUrl: true,
      industry: true,
      location: true,
      services: true,
      phone: true,
    },
  },
} as const;

function serializeUser(user: {
  id: string;
  email: string;
  profile: {
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    company: string | null;
    accountType: AccountType;
    isMentor: boolean;
    coverUrl: string | null;
    industry: string | null;
    location: string | null;
    services: string | null;
    phone: string | null;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.profile?.displayName ?? null,
    bio: user.profile?.bio ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    company: user.profile?.company ?? null,
    accountType: user.profile?.accountType ?? 'PERSONAL',
    isMentor: user.profile?.isMentor ?? false,
    coverUrl: user.profile?.coverUrl ?? null,
    industry: user.profile?.industry ?? null,
    location: user.profile?.location ?? null,
    services: user.profile?.services ?? null,
    phone: user.profile?.phone ?? null,
  };
}

export async function getSocialProfile(viewerId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...profileSelect,
      _count: { select: { posts: true, followers: true, following: true } },
    },
  });
  if (!user) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');
  const follow =
    viewerId === userId
      ? null
      : await prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
          select: { id: true },
        });
  return {
    user: serializeUser(user),
    counts: {
      posts: user._count.posts,
      followers: user._count.followers,
      following: user._count.following,
    },
    isMe: viewerId === userId,
    isFollowing: Boolean(follow),
  };
}

export async function toggleFollow(followerId: string, followingId: string) {
  if (followerId === followingId) throw new HttpError(400, 'Өөрийгөө дагах боломжгүй.');
  const target = await prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });
  if (!target) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });
  await prisma.$transaction(async (tx) => {
    if (existing) {
      await tx.follow.delete({ where: { id: existing.id } });
      await tx.notification.deleteMany({
        where: { recipientId: followingId, actorId: followerId, type: 'FOLLOW' },
      });
      return;
    }
    await tx.follow.create({ data: { followerId, followingId } });
    const actor = await tx.user.findUnique({
      where: { id: followerId },
      select: { email: true, profile: { select: { displayName: true } } },
    });
    const actorName = actor?.profile?.displayName || actor?.email.split('@')[0] || 'Хэрэглэгч';
    await tx.notification.create({
      data: {
        recipientId: followingId,
        actorId: followerId,
        type: 'FOLLOW',
        message: `${actorName} таныг дагаж эхэллээ.`,
      },
    });
  });

  const followersCount = await prisma.follow.count({ where: { followingId } });
  return { following: !existing, followersCount };
}

export async function listFollowers(viewerId: string, userId: string) {
  const rows = await prisma.follow.findMany({
    where: { followingId: userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { follower: { select: profileSelect } },
  });
  const viewerFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: rows.map((row) => row.followerId) } },
    select: { followingId: true },
  });
  const followedIds = new Set(viewerFollowing.map((follow) => follow.followingId));
  return {
    users: rows.map((row) => ({
      ...serializeUser(row.follower),
      isFollowing: followedIds.has(row.followerId),
    })),
  };
}

export async function listFollowing(viewerId: string, userId: string) {
  const rows = await prisma.follow.findMany({
    where: { followerId: userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { following: { select: profileSelect } },
  });
  const viewerFollowing = await prisma.follow.findMany({
    where: { followerId: viewerId, followingId: { in: rows.map((row) => row.followingId) } },
    select: { followingId: true },
  });
  const followedIds = new Set(viewerFollowing.map((follow) => follow.followingId));
  return {
    users: rows.map((row) => ({
      ...serializeUser(row.following),
      isFollowing: followedIds.has(row.followingId),
    })),
  };
}
