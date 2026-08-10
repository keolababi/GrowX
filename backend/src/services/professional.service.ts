import type { ProfessionalApplicationType, VerificationStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

type ApplicationInput = {
  type: ProfessionalApplicationType;
  organizationName?: string;
  registrationNumber?: string;
  websiteUrl?: string;
  expertise?: string;
  experience?: string;
  evidenceUrl: string;
};

async function requireAdmin(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'ADMIN') throw new HttpError(403, 'Admin эрх шаардлагатай.');
}

export async function listMyApplications(userId: string) {
  const applications = await prisma.professionalApplication.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { applications };
}

export async function listApplications(reviewerId: string, status?: VerificationStatus) {
  await requireAdmin(reviewerId);
  const applications = await prisma.professionalApplication.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { email: true, profile: { select: { displayName: true } } } },
    },
  });
  return { applications };
}

export async function submitApplication(userId: string, input: ApplicationInput) {
  const existing = await prisma.professionalApplication.findUnique({
    where: { userId_type: { userId, type: input.type } },
  });
  if (existing?.status === 'PENDING') {
    throw new HttpError(409, 'Таны хүсэлтийг одоогоор шалгаж байна.');
  }
  if (existing?.status === 'APPROVED') {
    throw new HttpError(409, 'Таны эрх аль хэдийн баталгаажсан байна.');
  }

  const data = {
    organizationName: input.type === 'BUSINESS' ? input.organizationName : null,
    registrationNumber: input.type === 'BUSINESS' ? input.registrationNumber : null,
    websiteUrl: input.websiteUrl ?? null,
    expertise: input.type === 'MENTOR' ? input.expertise : null,
    experience: input.type === 'MENTOR' ? input.experience : null,
    evidenceUrl: input.evidenceUrl,
    status: 'PENDING' as const,
    reviewNote: null,
    reviewedAt: null,
  };
  const application = await prisma.professionalApplication.upsert({
    where: { userId_type: { userId, type: input.type } },
    create: { userId, type: input.type, ...data },
    update: data,
  });
  return { application };
}

export async function reviewApplication(
  reviewerId: string,
  applicationId: string,
  status: Extract<VerificationStatus, 'APPROVED' | 'REJECTED'>,
  reviewNote?: string,
) {
  await requireAdmin(reviewerId);

  const application = await prisma.professionalApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application) throw new HttpError(404, 'Хүсэлт олдсонгүй.');
  if (application.status !== 'PENDING') {
    throw new HttpError(409, 'Энэ хүсэлтийг аль хэдийн шийдвэрлэсэн байна.');
  }

  return prisma.$transaction(async (tx) => {
    const reviewed = await tx.professionalApplication.update({
      where: { id: application.id },
      data: { status, reviewNote: reviewNote ?? null, reviewedAt: new Date() },
    });
    if (status === 'APPROVED') {
      await tx.profile.upsert({
        where: { userId: application.userId },
        create: {
          userId: application.userId,
          ...(application.type === 'BUSINESS'
            ? { accountType: 'BUSINESS' as const, company: application.organizationName }
            : { isMentor: true }),
        },
        update:
          application.type === 'BUSINESS'
            ? { accountType: 'BUSINESS', company: application.organizationName }
            : { isMentor: true },
      });
    }
    return { application: reviewed };
  });
}
