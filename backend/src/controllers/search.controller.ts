import type { Request, Response } from 'express';
import { z } from 'zod';
import * as searchService from '../services/search.service.js';

export async function search(req: Request, res: Response): Promise<void> {
  const query = z.string().trim().max(100).catch('').parse(req.query.q);
  res.status(200).json(await searchService.globalSearch(req.auth!.userId, query));
}
