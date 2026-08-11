import { prisma } from '../config/prisma.js';

const LIMIT = 8;

export async function globalSearch(userId: string, query: string) {
  const q = query.trim();
  const textFilter = (fields: string[]) =>
    q
      ? fields.map((field) => ({ [field]: { contains: q, mode: 'insensitive' as const } }))
      : undefined;

  const [users, communities, posts, lessons, podcasts] = await Promise.all([
    prisma.user.findMany({
      where: {
        id: { not: userId },
        ...(q
          ? {
              OR: [
                { email: { contains: q, mode: 'insensitive' } },
                { profile: { displayName: { contains: q, mode: 'insensitive' } } },
                { profile: { company: { contains: q, mode: 'insensitive' } } },
                { profile: { industry: { contains: q, mode: 'insensitive' } } },
                { profile: { bio: { contains: q, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        email: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            bio: true,
            company: true,
            accountType: true,
            isMentor: true,
            industry: true,
          },
        },
      },
    }),
    prisma.community.findMany({
      where: q
        ? { OR: textFilter(['name', 'description']) as Array<Record<string, unknown>> }
        : undefined,
      orderBy: [{ members: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: LIMIT,
      include: { _count: { select: { members: true, posts: true } } },
    }),
    prisma.post.findMany({
      where: {
        OR: [
          { communityId: null },
          { community: { is: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] } } },
        ],
        ...(q ? { content: { contains: q, mode: 'insensitive' } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      select: {
        id: true,
        content: true,
        imageUrl: true,
        createdAt: true,
        community: { select: { id: true, name: true } },
        author: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true, avatarUrl: true, company: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    }),
    prisma.lesson.findMany({
      where: {
        published: true,
        ...(q
          ? {
              OR: textFilter(['title', 'description', 'content', 'category']) as Array<
                Record<string, unknown>
              >,
            }
          : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      take: LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        difficulty: true,
        durationMin: true,
      },
    }),
    prisma.podcast.findMany({
      where: q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { episodes: { some: { title: { contains: q, mode: 'insensitive' } } } },
            ],
          }
        : undefined,
      orderBy: [{ listens: { _count: 'desc' } }, { createdAt: 'desc' }],
      take: LIMIT,
      select: {
        id: true,
        title: true,
        description: true,
        coverUrl: true,
        author: {
          select: {
            id: true,
            email: true,
            profile: { select: { displayName: true } },
          },
        },
        episodes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, title: true, durationSec: true },
        },
      },
    }),
  ]);

  return {
    query: q,
    users: users.map((item) => ({
      id: item.id,
      email: item.email,
      displayName: item.profile?.displayName ?? null,
      avatarUrl: item.profile?.avatarUrl ?? null,
      bio: item.profile?.bio ?? null,
      company: item.profile?.company ?? null,
      accountType: item.profile?.accountType ?? 'PERSONAL',
      isMentor: item.profile?.isMentor ?? false,
      industry: item.profile?.industry ?? null,
    })),
    communities: communities.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      coverUrl: item.coverUrl,
      memberCount: item._count.members,
      postCount: item._count.posts,
    })),
    posts: posts.map((item) => ({
      id: item.id,
      content: item.content,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      community: item.community,
      author: {
        id: item.author.id,
        email: item.author.email,
        displayName: item.author.profile?.displayName ?? null,
        avatarUrl: item.author.profile?.avatarUrl ?? null,
        company: item.author.profile?.company ?? null,
      },
      likeCount: item._count.likes,
      commentCount: item._count.comments,
    })),
    lessons,
    podcasts: podcasts.map((item) => ({
      ...item,
      author: {
        id: item.author.id,
        email: item.author.email,
        displayName: item.author.profile?.displayName ?? null,
      },
    })),
  };
}
