export type ChatUser = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  lastSeenAt: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
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
