export type MessageStatus =
  | "PENDING_PAYMENT"
  | "AWAITING_REPLY"
  | "REPLIED"
  | "DECLINED"
  | "EXPIRED"
  | "REFUNDED";

export interface Participant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

export interface ConversationMessage {
  id: string;
  content: string;

  status: MessageStatus;

  createdAt: string;
  expiresAt?: string;

  conversationId: string;

  sender?: Participant;

  payment?: {
    amount: number;
  };

  replyContent?: string;
}

export interface ConversationThread {
  conversationId: string;

  senderId: string;
  creatorId?: string;

  senderName: string;
  avatarUrl?: string | null;

  messages: ConversationMessage[];

  hasPending: boolean;

  latestTimestamp: string;

  totalBounty: number;
}
