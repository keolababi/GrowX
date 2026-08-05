export type NotificationType = 'LIKE' | 'COMMENT' | 'FOLLOW' | 'SYSTEM' | 'COLLABORATION_REQUEST';

export type AppNotification = {
  id: string;
  type: NotificationType;
  message: string;
  postId: string | null;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
  } | null;
};
