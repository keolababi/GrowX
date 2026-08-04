export type CollaborationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';

export type CollaborationUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  company: string | null;
  accountType: 'PERSONAL' | 'BUSINESS';
  industry: string | null;
};

export type CollaborationRequest = {
  id: string;
  message: string;
  status: CollaborationStatus;
  createdAt: string;
  user: CollaborationUser;
};
