import { prisma } from '../config/prisma.js';
import { HttpError } from '../utils/http-error.js';

const lessonSelect = {
  id: true,
  title: true,
  description: true,
  content: true,
  category: true,
  difficulty: true,
  durationMin: true,
} as const;

export async function listLessons() {
  const lessons = await prisma.lesson.findMany({
    where: { published: true },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    select: lessonSelect,
  });
  return { lessons };
}

export async function getLesson(lessonId: string) {
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, published: true },
    select: lessonSelect,
  });
  if (!lesson) throw new HttpError(404, 'Хичээл олдсонгүй.');
  return { lesson };
}
