import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

export async function listCommunities(userId: string) {
  const communities = await prisma.community.findMany({
    orderBy: { createdAt: 'desc' },
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
      ownerId: community.ownerId,
      memberCount: community._count.members,
      postCount: community._count.posts,
      joinedByMe: community.ownerId === userId || community.members.length > 0,
    })),
  };
}

export async function createCommunity(
  userId: string,
  input: { name: string; description?: string },
) {
  const existing = await prisma.community.findUnique({ where: { name: input.name } });
  if (existing) throw new HttpError(409, 'Ийм нэртэй community бүртгэлтэй байна.');
  const community = await prisma.community.create({
    data: {
      ownerId: userId,
      name: input.name,
      description: input.description,
      members: { create: { userId } },
    },
  });
  return { community };
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
