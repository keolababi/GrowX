import type { Request, Response } from 'express';
import { z } from 'zod';
import * as professionalService from '../services/professional.service.js';

const applicationSchema = z
  .object({
    type: z.enum(['BUSINESS', 'MENTOR']),
    organizationName: z.string().trim().min(2).max(160).optional(),
    registrationNumber: z.string().trim().min(2).max(80).optional(),
    websiteUrl: z.string().trim().url().max(2048).optional(),
    expertise: z.string().trim().min(2).max(160).optional(),
    experience: z.string().trim().min(20).max(3000).optional(),
    evidenceUrl: z.string().trim().url().max(2048),
  })
  .superRefine((value, context) => {
    if (value.type === 'BUSINESS') {
      if (!value.organizationName) {
        context.addIssue({ code: 'custom', path: ['organizationName'], message: 'required' });
      }
      if (!value.registrationNumber) {
        context.addIssue({ code: 'custom', path: ['registrationNumber'], message: 'required' });
      }
    }
    if (value.type === 'MENTOR') {
      if (!value.expertise) {
        context.addIssue({ code: 'custom', path: ['expertise'], message: 'required' });
      }
      if (!value.experience) {
        context.addIssue({ code: 'custom', path: ['experience'], message: 'required' });
      }
    }
  });
const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  reviewNote: z.string().trim().max(500).optional(),
});
const idSchema = z.object({ applicationId: z.string().min(1) });
const statusQuerySchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional();

export async function mine(req: Request, res: Response): Promise<void> {
  res.status(200).json(await professionalService.listMyApplications(req.auth!.userId));
}

export async function list(req: Request, res: Response): Promise<void> {
  const status = statusQuerySchema.parse(req.query.status);
  res.status(200).json(await professionalService.listApplications(req.auth!.userId, status));
}

export async function submit(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(
      await professionalService.submitApplication(
        req.auth!.userId,
        applicationSchema.parse(req.body),
      ),
    );
}

export async function review(req: Request, res: Response): Promise<void> {
  const { applicationId } = idSchema.parse(req.params);
  const { status, reviewNote } = reviewSchema.parse(req.body);
  res
    .status(200)
    .json(
      await professionalService.reviewApplication(
        req.auth!.userId,
        applicationId,
        status,
        reviewNote,
      ),
    );
}
