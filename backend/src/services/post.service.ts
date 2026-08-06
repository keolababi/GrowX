import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const authorSelect = {
  id: true,
  email: true,
  profile: { select: { displayName: true, avatarUrl: true, company: true } },
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
  profile: { displayName: string | null; avatarUrl: string | null; company: string | null } | null;
}) {
  return {
    id: author.id,
    email: author.email,
    displayName: author.profile?.displayName ?? null,
    avatarUrl: author.profile?.avatarUrl ?? null,
    company: author.profile?.company ?? null,
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
  communityPostType: string | null;
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
    communityPostType: post.communityPostType,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
    likedByMe: post.likes.length > 0,
    comments: post.comments.map((comment) => ({
      ...comment,
      author: serializeAuthor(comment.author),
    })),
  };
}

const visibleToUserWhere = (userId: string) => ({
  OR: [
    { communityId: null },
    {
      community: {
        is: {
          OR: [{ ownerId: userId }, { members: { some: { userId } } }],
        },
      },
    },
  ],
});

async function requirePostAccess(userId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...visibleToUserWhere(userId) },
    select: { id: true, authorId: true },
  });
  if (!post) throw new HttpError(404, 'Post олдсонгүй эсвэл та энэ бүлгийн гишүүн биш байна.');
  return post;
}

export async function listPosts(userId: string) {
  const posts = await prisma.post.findMany({
    where: visibleToUserWhere(userId),
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: postInclude(userId),
  });
  return { posts: posts.map(serializePost) };
}

export async function listUserPosts(viewerId: string, authorId: string) {
  const author = await prisma.user.findUnique({ where: { id: authorId }, select: { id: true } });
  if (!author) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');
  const posts = await prisma.post.findMany({
    where: { authorId, ...visibleToUserWhere(viewerId) },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: postInclude(viewerId),
  });
  return { posts: posts.map(serializePost) };
}

export async function getPost(userId: string, postId: string) {
  const post = await prisma.post.findFirst({
    where: { id: postId, ...visibleToUserWhere(userId) },
    include: postInclude(userId),
  });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');
  return { post: serializePost(post) };
}

export async function createPost(
  userId: string,
  input: {
    content: string;
    imageUrl?: string;
    videoUrl?: string;
    communityId?: string;
    communityPostType?: 'DISCUSSION' | 'ARTICLE';
  },
) {
  if (input.communityId) {
    const community = await prisma.community.findFirst({
      where: {
        id: input.communityId,
        OR: [{ ownerId: userId }, { members: { some: { userId } } }],
      },
    });
    if (!community) throw new HttpError(403, 'Нийтлэл оруулахын тулд эхлээд бүлэгт нэгдэнэ үү.');
  }
  const post = await prisma.post.create({
    data: {
      authorId: userId,
      content: input.content,
      imageUrl: input.imageUrl,
      videoUrl: input.videoUrl,
      communityId: input.communityId,
      communityPostType: input.communityId ? input.communityPostType : undefined,
    },
    include: postInclude(userId),
  });
  return { post: serializePost(post) };
}

export async function updatePost(userId: string, postId: string, input: { content: string }) {
  const existing = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (!existing) throw new HttpError(404, 'Post олдсонгүй.');
  if (existing.authorId !== userId) {
    throw new HttpError(403, 'Энэ post-ийг засах эрхгүй байна.');
  }
  const post = await prisma.post.update({
    where: { id: postId },
    data: { content: input.content },
    include: postInclude(userId),
  });
  return { post: serializePost(post) };
}

export async function toggleLike(userId: string, postId: string) {
  const post = await requirePostAccess(userId, postId);

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
  const post = await requirePostAccess(userId, postId);
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

export async function listComments(userId: string, postId: string) {
  await requirePostAccess(userId, postId);
  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: authorSelect } },
  });
  return {
    comments: comments.map((comment) => ({
      ...comment,
      author: serializeAuthor(comment.author),
    })),
  };
}

export async function updateComment(
  userId: string,
  postId: string,
  commentId: string,
  content: string,
) {
  await requirePostAccess(userId, postId);
  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });
  if (!existing || existing.postId !== postId) throw new HttpError(404, 'Сэтгэгдэл олдсонгүй.');
  if (existing.authorId !== userId) {
    throw new HttpError(403, 'Зөвхөн өөрийн сэтгэгдлийг засах боломжтой.');
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { content },
    include: { author: { select: authorSelect } },
  });
  return {
    comment: {
      ...comment,
      author: serializeAuthor(comment.author),
    },
  };
}

export async function deleteComment(userId: string, postId: string, commentId: string) {
  await requirePostAccess(userId, postId);
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });
  if (!comment || comment.postId !== postId) throw new HttpError(404, 'Сэтгэгдэл олдсонгүй.');
  if (comment.authorId !== userId) {
    throw new HttpError(403, 'Энэ сэтгэгдлийг устгах эрхгүй байна.');
  }
  await prisma.comment.delete({ where: { id: commentId } });
}

export async function deletePost(userId: string, postId: string) {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { authorId: true } });
  if (!post) throw new HttpError(404, 'Post олдсонгүй.');
  if (post.authorId !== userId) throw new HttpError(403, 'Энэ post-ийг устгах эрхгүй байна.');
  await prisma.post.delete({ where: { id: postId } });
}
