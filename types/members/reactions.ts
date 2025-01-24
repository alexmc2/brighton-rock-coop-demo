export type EmojiType = string;

interface ReactionUser {
  email: string;
  full_name: string | null;
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: EmojiType;
  created_at: string;
  user: ReactionUser;
}

// Type for the Supabase response
export interface CommentReactionResponse {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: EmojiType;
  created_at: string;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export interface EmojiCount {
  emoji: EmojiType;
  count: number;
  users: {
    user_id: string;
    email: string;
    full_name: string | null;
  }[];
}
