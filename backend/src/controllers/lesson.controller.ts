import type { Request, Response } from 'express';
import { z } from 'zod';
import * as lessonService from '../services/lesson.service.js';

const lessonIdSchema = z.string().trim().min(1).max(120);

export async function listLessons(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await lessonService.listLessons());
}

export async function getLesson(req: Request, res: Response): Promise<void> {
  const lessonId = lessonIdSchema.parse(req.params.lessonId);
  res.status(200).json(await lessonService.getLesson(lessonId));
}
