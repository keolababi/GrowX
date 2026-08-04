import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const userSelect = {
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
} as const;

function serializeUser(user: {
  id: string;
  email: string;
  profile: {
    displayName: string | null;
    avatarUrl: string | null;
    bio: string | null;
    company: string | null;
    accountType: string;
    isMentor: boolean;
    industry: string | null;
  } | null;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.profile?.displayName ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    bio: user.profile?.bio ?? null,
    company: user.profile?.company ?? null,
    accountType: user.profile?.accountType ?? 'PERSONAL',
    isMentor: user.profile?.isMentor ?? false,
    industry: user.profile?.industry ?? null,
  };
}

export async function sendRequest(requesterId: string, targetId: string, message: string) {
  if (requesterId === targetId) throw new HttpError(400, 'Өөртөө хүсэлт илгээх боломжгүй.');
  const target = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
  if (!target) throw new HttpError(404, 'Хэрэглэгч олдсонгүй.');

  const existingPending = await prisma.collaborationRequest.findUnique({
    where: {
      requesterId_targetId_status: { requesterId, targetId, status: 'PENDING' },
    },
  });
  if (existingPending) throw new HttpError(409, 'Хүсэлт аль хэдийн илгээгдсэн байна.');

  const request = await prisma.collaborationRequest.create({
    data: { requesterId, targetId, message },
  });

  const requester = await prisma.user.findUnique({
    where: { id: requesterId },
    select: { email: true, profile: { select: { displayName: true } } },
  });
  const requesterName =
    requester?.profile?.displayName || requester?.email.split('@')[0] || 'Хэрэглэгч';
  await prisma.notification.create({
    data: {
      recipientId: targetId,
      actorId: requesterId,
      type: 'COLLABORATION_REQUEST',
      message: `${requesterName} хамтран ажиллах хүсэлт илгээлээ.`,
    },
  });

  return { id: request.id, status: request.status };
}

export async function listReceivedRequests(userId: string) {
  const rows = await prisma.collaborationRequest.findMany({
    where: { targetId: userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { requester: { select: userSelect } },
  });
  return {
    requests: rows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      user: serializeUser(row.requester),
    })),
  };
}

export async function listSentRequests(userId: string) {
  const rows = await prisma.collaborationRequest.findMany({
    where: { requesterId: userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { target: { select: userSelect } },
  });
  return {
    requests: rows.map((row) => ({
      id: row.id,
      message: row.message,
      status: row.status,
      createdAt: row.createdAt,
      user: serializeUser(row.target),
    })),
  };
}

export async function respondToRequest(userId: string, requestId: string, accept: boolean) {
  const request = await prisma.collaborationRequest.findUnique({ where: { id: requestId } });
  if (!request || request.targetId !== userId) throw new HttpError(404, 'Хүсэлт олдсонгүй.');
  if (request.status !== 'PENDING') throw new HttpError(409, 'Хүсэлт аль хэдийн шийдэгдсэн байна.');

  const status = accept ? 'ACCEPTED' : 'DECLINED';
  await prisma.$transaction(async (tx) => {
    await tx.collaborationRequest.update({ where: { id: requestId }, data: { status } });
    if (accept) {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { email: true, profile: { select: { displayName: true } } },
      });
      const targetName = target?.profile?.displayName || target?.email.split('@')[0] || 'Хэрэглэгч';
      await tx.notification.create({
        data: {
          recipientId: request.requesterId,
          actorId: userId,
          type: 'COLLABORATION_REQUEST',
          message: `${targetName} таны хамтран ажиллах хүсэлтийг зөвшөөрлөө.`,
        },
      });
    }
  });

  return { status };
}
