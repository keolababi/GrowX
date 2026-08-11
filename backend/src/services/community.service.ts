import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

async function requireCommunityOwner(userId: string, communityId: string) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  });
  if (!community) throw new HttpError(404, 'Бүлэг олдсонгүй.');
  if (community.ownerId !== userId) {
    throw new HttpError(403, 'Зөвхөн бүлгийн админ энэ үйлдлийг хийх эрхтэй.');
  }
  return community;
}

export async function listCommunities(userId: string) {
  const communities = await prisma.community.findMany({
    orderBy: [{ members: { _count: 'desc' } }, { createdAt: 'desc' }],
    include: {
      _count: { select: { members: true, posts: true } },
      members: { where: { userId }, select: { id: true }, take: 1 },
    },
  });
  return {
    communities: communities.map((community) => ({
      id: community.id,
      name: community.name,
      description: community.description,
      coverUrl: community.coverUrl,
      ownerId: community.ownerId,
      memberCount: community._count.members,
      postCount: community._count.posts,
      joinedByMe: community.ownerId === userId || community.members.length > 0,
    })),
  };
}

export async function createCommunity(
  userId: string,
  input: { name: string; description?: string; coverUrl?: string },
) {
  const existing = await prisma.community.findUnique({ where: { name: input.name } });
  if (existing) throw new HttpError(409, 'Ийм нэртэй community бүртгэлтэй байна.');
  const community = await prisma.community.create({
    data: {
      ownerId: userId,
      name: input.name,
      description: input.description,
      coverUrl: input.coverUrl,
      members: { create: { userId } },
    },
  });
  return { community };
}

export async function getCommunity(userId: string, communityId: string) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    include: {
      _count: { select: { members: true, posts: true } },
      members: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              profile: { select: { displayName: true, avatarUrl: true, bio: true } },
            },
          },
        },
      },
    },
  });
  if (!community) throw new HttpError(404, 'Бүлэг олдсонгүй.');

  const joinedByMe =
    community.ownerId === userId || community.members.some((member) => member.userId === userId);
  return {
    community: {
      id: community.id,
      name: community.name,
      description: community.description,
      coverUrl: community.coverUrl,
      ownerId: community.ownerId,
      memberCount: community._count.members,
      postCount: community._count.posts,
      joinedByMe,
      isOwner: community.ownerId === userId,
      members: community.members.map((member) => ({
        id: member.user.id,
        email: member.user.email,
        displayName: member.user.profile?.displayName ?? null,
        avatarUrl: member.user.profile?.avatarUrl ?? null,
        bio: member.user.profile?.bio ?? null,
        isOwner: member.user.id === community.ownerId,
      })),
    },
  };
}

export async function toggleMembership(userId: string, communityId: string) {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
    select: { ownerId: true },
  });
  if (!community) throw new HttpError(404, 'Community олдсонгүй.');
  if (community.ownerId === userId) return { joined: true };

  const membership = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId, communityId } },
  });
  if (membership) {
    await prisma.communityMember.delete({ where: { id: membership.id } });
  } else {
    await prisma.communityMember.create({ data: { userId, communityId } });
  }
  return { joined: !membership };
}

export async function searchMemberCandidates(ownerId: string, communityId: string, query: string) {
  await requireCommunityOwner(ownerId, communityId);
  const normalized = query.trim();
  const users = await prisma.user.findMany({
    where: {
      id: { not: ownerId },
      communityMemberships: { none: { communityId } },
      ...(normalized
        ? {
            OR: [
              { email: { contains: normalized, mode: 'insensitive' } },
              { profile: { displayName: { contains: normalized, mode: 'insensitive' } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      email: true,
      profile: { select: { displayName: true, avatarUrl: true, bio: true } },
    },
  });
  return {
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
      bio: user.profile?.bio ?? null,
      isOwner: false,
    })),
  };
}

export async function addCommunityMember(
  ownerId: string,
  communityId: string,
  memberUserId: string,
) {
  const community = await requireCommunityOwner(ownerId, communityId);
  if (community.ownerId === memberUserId) {
    throw new HttpError(400, 'Бүлгийн админ аль хэдийн гишүүн байна.');
  }
  const user = await prisma.user.findUnique({
    where: { id: memberUserId },
    select: { id: true },
  });
  if (!user) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');
  await prisma.communityMember.upsert({
    where: { userId_communityId: { userId: memberUserId, communityId } },
    create: { userId: memberUserId, communityId },
    update: {},
  });
  return { added: true };
}

export async function removeCommunityMember(
  ownerId: string,
  communityId: string,
  memberUserId: string,
) {
  const community = await requireCommunityOwner(ownerId, communityId);
  if (community.ownerId === memberUserId) {
    throw new HttpError(400, 'Бүлгийн админыг гишүүдээс хасах боломжгүй.');
  }
  const deleted = await prisma.communityMember.deleteMany({
    where: { communityId, userId: memberUserId },
  });
  if (!deleted.count) throw new HttpError(404, 'Бүлгийн гишүүн олдсонгүй.');
}

export async function deleteCommunity(ownerId: string, communityId: string) {
  await requireCommunityOwner(ownerId, communityId);
  await prisma.community.delete({ where: { id: communityId } });
}
