export type ChatUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
};

export type ChatMessage = {
  id: string;
  clientMessageId?: string | null;
  conversationId: string;
  senderId: string;
  content: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'AUDIO' | null;
  mediaUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  sender: ChatUser;
};

export type Conversation = {
  id: string;
  updatedAt: string;
  otherUser: ChatUser | null;
  lastMessage: Omit<ChatMessage, 'sender'> | null;
  unreadCount: number;
};
