import type { Request, Response } from 'express';
import { z } from 'zod';
import * as postService from '../services/post.service.js';

const postIdSchema = z.object({ postId: z.string().min(1) });
const commentIdSchema = postIdSchema.extend({ commentId: z.string().min(1) });
const userIdSchema = z.object({ userId: z.string().min(1) });
const createPostSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  imageUrl: z.string().url().max(2048).optional(),
  videoUrl: z.string().url().max(2048).optional(),
  communityId: z.string().min(1).optional(),
  communityPostType: z.enum(['DISCUSSION', 'ARTICLE']).optional(),
});
const commentSchema = z.object({ content: z.string().trim().min(1).max(1000) });
const updatePostSchema = z.object({ content: z.string().trim().min(1).max(5000) });

export async function list(req: Request, res: Response): Promise<void> {
  res.status(200).json(await postService.listPosts(req.auth!.userId));
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  res.status(200).json(await postService.getPost(req.auth!.userId, postId));
}

export async function listByUser(req: Request, res: Response): Promise<void> {
  const { userId } = userIdSchema.parse(req.params);
  res.status(200).json(await postService.listUserPosts(req.auth!.userId, userId));
}

export async function create(req: Request, res: Response): Promise<void> {
  res
    .status(201)
    .json(await postService.createPost(req.auth!.userId, createPostSchema.parse(req.body)));
}

export async function update(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  res
    .status(200)
    .json(await postService.updatePost(req.auth!.userId, postId, updatePostSchema.parse(req.body)));
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  res.status(200).json(await postService.toggleLike(req.auth!.userId, postId));
}

export async function listComments(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  res.status(200).json(await postService.listComments(req.auth!.userId, postId));
}

export async function comment(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  const { content } = commentSchema.parse(req.body);
  res.status(201).json(await postService.addComment(req.auth!.userId, postId, content));
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  const { postId, commentId } = commentIdSchema.parse(req.params);
  const { content } = commentSchema.parse(req.body);
  res
    .status(200)
    .json(await postService.updateComment(req.auth!.userId, postId, commentId, content));
}

export async function removeComment(req: Request, res: Response): Promise<void> {
  const { postId, commentId } = commentIdSchema.parse(req.params);
  await postService.deleteComment(req.auth!.userId, postId, commentId);
  res.status(204).send();
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { postId } = postIdSchema.parse(req.params);
  await postService.deletePost(req.auth!.userId, postId);
  res.status(204).send();
}
