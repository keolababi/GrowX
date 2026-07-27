import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const authorSelect = {
  id: true,
  email: true,
  profile: { select: { displayName: true, avatarUrl: true } },
} as const;

const postInclude = (userId: string) =>
  ({
    author: { select: authorSelect },
    community: { select: { id: true, name: true } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId }, select: { id: true }, take: 1 },
    comments: {
      orderBy: { createdAt: 'asc' as const },
      take: 3,
      include: { author: { select: authorSelect } },
    },
  }) as const;

function serializeAuthor(author: {
  id: string;
  email: string;
  profile: { displayName: string | null; avatarUrl: string | null } | null;
}) {
  return {
    id: author.id,
    email: author.email,
    displayName: author.profile?.displayName ?? null,
    avatarUrl: author.profile?.avatarUrl ?? null,
  };
}

function serializePost(post: {
  id: string;
  authorId: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  author: Parameters<typeof serializeAuthor>[0];
  community: { id: string; name: string } | null;
  _count: { likes: number; comments: number };
  likes: { id: string }[];
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date;
    author: Parameters<typeof serializeAuthor>[0];
  }>;
}) {
  return {
    id: post.id,
    authorId: post.authorId,
    content: post.content,
    imageUrl: post.imageUrl,
    videoUrl: post.videoUrl,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: serializeAuthor(post.author),
    community: post.community,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    comments: post.comments.map((comment) => ({
      ...comment,
      author: serializeAuthor(comment.author),
    })),
  };
}

export async function listPosts(userId: string) {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: postInclude(userId),
  });
  return { posts: posts.map(serializePost) };
}

export async function getPost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: postInclude(userId),
  });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');
  return { post: serializePost(post) };
}

export async function createPost(
  userId: string,
  input: { content: string; imageUrl?: string; videoUrl?: string; communityId?: string },
) {
  if (input.communityId) {
    const community = await prisma.community.findUnique({ where: { id: input.communityId } });
    if (!community) throw new HttpError(404, 'Community олдсонгүй.');
  }
  const post = await prisma.post.create({
    data: {
      authorId: userId,
      content: input.content,
      imageUrl: input.imageUrl,
      videoUrl: input.videoUrl,
      communityId: input.communityId,
    },
    include: postInclude(userId),
  });
  return { post: serializePost(post) };
}

export async function toggleLike(userId: string, postId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');

  return prisma.$transaction(async (tx) => {
    const existing = await tx.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    if (existing) {
      await tx.like.delete({ where: { id: existing.id } });
      await tx.notification.deleteMany({
        where: { recipientId: post.authorId, actorId: userId, postId, type: 'LIKE' },
      });
    } else {
      await tx.like.create({ data: { userId, postId } });
      if (post.authorId !== userId) {
        const actor = await tx.user.findUnique({
          where: { id: userId },
          select: { email: true, profile: { select: { displayName: true } } },
        });
        const actorName = actor?.profile?.displayName || actor?.email.split('@')[0] || 'Хэрэглэгч';
        await tx.notification.create({
          data: {
            recipientId: post.authorId,
            actorId: userId,
            postId,
            type: 'LIKE',
            message: `${actorName} таны постод лайк дарлаа.`,
          },
        });
      }
    }
    const likeCount = await tx.like.count({ where: { postId } });
    return { liked: !existing, likeCount };
  });
}

export async function addComment(userId: string, postId: string, content: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true },
  });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');
  const comment = await prisma.$transaction(async (tx) => {
    const created = await tx.comment.create({
      data: { authorId: userId, postId, content },
      include: { author: { select: authorSelect } },
    });
    if (post.authorId !== userId) {
      const actorName =
        created.author.profile?.displayName || created.author.email.split('@')[0] || 'Хэрэглэгч';
      await tx.notification.create({
        data: {
          recipientId: post.authorId,
          actorId: userId,
          postId,
          type: 'COMMENT',
          message: `${actorName} таны постод сэтгэгдэл үлдээлээ.`,
        },
      });
    }
    return created;
  });
  return {
    comment: {
      ...comment,
      author: serializeAuthor(comment.author),
    },
  };
}

export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');
  if (post.authorId !== userId) throw new HttpError(403, 'Энэ post-ийг устгах эрхгүй байна.');
  await prisma.post.delete({ where: { id: postId } });
}
