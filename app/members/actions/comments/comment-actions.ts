'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type {
  BaseComment,
  CommentResourceType,
} from '@/types/members/comments';
import type { CommentReaction, EmojiType } from '@/types/members/reactions';

type DatabaseReactionResponse = {
  id: string;
  comment_id: string;
  user_id: string;
  emoji: EmojiType;
  created_at: string;
  demo_profiles: {
    email: string;
    full_name: string | null;
  };
};

const getTableName = (type: CommentResourceType['type']) => {
  const tables = {
    development: 'demo_development_comments',
    garden: 'demo_garden_comments',
    maintenance: 'demo_maintenance_comments',
    task: 'demo_task_comments',
    todo: 'demo_todo_comments',
    social_event: 'demo_social_event_comments',
  };
  return tables[type];
};

export async function addComment(
  content: string,
  resourceId: string,
  resourceType: CommentResourceType
) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be logged in to comment');
  }

  const tableName = getTableName(resourceType.type);
  const insertData = {
    [resourceType.field]: resourceId,
    [resourceType.userField]: user.id,
    [resourceType.contentField]: content,
  };

  const { error: insertError } = await supabase
    .from(tableName)
    .insert(insertData);

  if (insertError) throw insertError;
}

export async function updateComment(
  commentId: string,
  content: string,
  userId: string,
  resourceType: CommentResourceType
) {
  const supabase = createServerComponentClient({ cookies });

  const tableName = getTableName(resourceType.type);
  const updateData = {
    [resourceType.contentField]: content,
  };

  const { error: updateError } = await supabase
    .from(tableName)
    .update(updateData)
    .eq('id', commentId)
    .eq(resourceType.userField, userId);

  if (updateError) throw updateError;
}

export async function deleteComment(
  commentId: string,
  resourceType: CommentResourceType
) {
  const supabase = createServerComponentClient({ cookies });

  const { error } = await supabase
    .from(getTableName(resourceType.type))
    .delete()
    .eq('id', commentId);

  if (error) throw error;
}

export async function addReaction(commentId: string, emoji: EmojiType) {
  const supabase = createServerComponentClient({ cookies });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    throw new Error('You must be logged in to react');
  }

  const { data, error } = await supabase
    .from('demo_comment_reactions')
    .insert({
      comment_id: commentId,
      user_id: user.id,
      emoji,
    })
    .select(
      `
      id,
      comment_id,
      user_id,
      emoji,
      created_at,
      demo_profiles (
        email,
        full_name
      )
    `
    )
    .single();

  if (error) throw error;

  if (!data) return null;

  // Format the data to match CommentReaction type
  const reaction = data as unknown as DatabaseReactionResponse;
  return {
    id: reaction.id,
    comment_id: reaction.comment_id,
    user_id: reaction.user_id,
    emoji: reaction.emoji,
    created_at: reaction.created_at,
    user: {
      email: reaction.demo_profiles.email,
      full_name: reaction.demo_profiles.full_name,
    },
  };
}

export async function deleteReaction(reactionId: string) {
  const supabase = createServerComponentClient({ cookies });

  const { error } = await supabase
    .from('demo_comment_reactions')
    .delete()
    .eq('id', reactionId);

  if (error) throw error;
}

export async function getReactions(commentIds: string[]) {
  const supabase = createServerComponentClient({ cookies });

  const { data, error } = await supabase
    .from('demo_comment_reactions')
    .select(
      `
      id,
      comment_id,
      user_id,
      emoji,
      created_at,
      demo_profiles (
        email,
        full_name
      )
    `
    )
    .in('comment_id', commentIds);

  if (error) throw error;

  // Format the data to match CommentReaction type
  return (data as unknown as DatabaseReactionResponse[]).map((reaction) => ({
    id: reaction.id,
    comment_id: reaction.comment_id,
    user_id: reaction.user_id,
    emoji: reaction.emoji,
    created_at: reaction.created_at,
    user: {
      email: reaction.demo_profiles.email,
      full_name: reaction.demo_profiles.full_name,
    },
  }));
}

export async function getCurrentUser() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  return user;
}
