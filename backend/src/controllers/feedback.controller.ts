import type { Request, Response } from 'express';
import { z } from 'zod';
import * as feedbackService from '../services/feedback.service.js';

const questionTypeSchema = z.enum([
  'SHORT_ANSWER',
  'LONG_ANSWER',
  'MULTIPLE_CHOICE',
  'CHECKBOXES',
  'RATING',
  'SCALE',
  'YES_NO',
]);

const questionSchema = z.object({
  type: questionTypeSchema,
  label: z.string().trim().min(1).max(500),
  options: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  required: z.boolean().default(true),
});

const createFormSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  questions: z.array(questionSchema).min(1).max(50),
});

const answerSchema = z.object({
  questionId: z.string().min(1),
  textValue: z.string().trim().max(5000).optional(),
  optionsValue: z.array(z.string().trim().max(200)).max(20).optional(),
});

const submitResponseSchema = z.object({
  answers: z.array(answerSchema),
});

const formIdSchema = z.object({ formId: z.string().min(1) });

export async function listMyForms(req: Request, res: Response): Promise<void> {
  res.status(200).json(await feedbackService.listMyForms(req.auth!.userId));
}

export async function createForm(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await feedbackService.createForm(req.auth!.userId, createFormSchema.parse(req.body)));
}

export async function getForm(req: Request, res: Response): Promise<void> {
  const { formId } = formIdSchema.parse(req.params);
  res.status(200).json(await feedbackService.getForm(req.auth!.userId, formId));
}

export async function deleteForm(req: Request, res: Response): Promise<void> {
  const { formId } = formIdSchema.parse(req.params);
  await feedbackService.deleteForm(req.auth!.userId, formId);
  res.status(204).send();
}

export async function submitResponse(req: Request, res: Response): Promise<void> {
  const { formId } = formIdSchema.parse(req.params);
  const { answers } = submitResponseSchema.parse(req.body);
  res.status(201).json(await feedbackService.submitResponse(req.auth!.userId, formId, answers));
}

export async function listResponses(req: Request, res: Response): Promise<void> {
  const { formId } = formIdSchema.parse(req.params);
  res.status(200).json(await feedbackService.listResponses(req.auth!.userId, formId));
}
