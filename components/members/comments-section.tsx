// components/ui/comment-section.tsx

'use client';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/members/ui/button';
import { Textarea } from '@/components/members/ui/textarea';
import { getUserColor } from '@/lib/members/utils';
import type {
  BaseComment,
  CommentSectionProps,
} from '@/types/members/comments';
import {
  type CommentReaction,
  type EmojiType,
  type EmojiCount,
} from '@/types/members/reactions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/members/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/members/ui/popover';
import { SmilePlus } from 'lucide-react';
import {
  addComment,
  updateComment,
  deleteComment,
  addReaction,
  deleteReaction,
  getReactions,
  getCurrentUser,
} from '@/app/members/actions/comments/comment-actions';

const COMMENTS_PER_PAGE = 5;
const EMOJI_LIST: EmojiType[] = [
  '👍',
  '❤️',
  '😂',
  '😊',
  '😀',
  '🤣',
  '😊',
  '😍',
  '😎',
  '😏',
  '😮',
  '😢',
  '😡',
  '🎉',
  '🔥',
  '👏',
  '🙌',
  '✨',
  '💯',
  '🤔',
  '👀',
  '🌟',
  '💪',
  '🙏',
  '🤝',
  '💖',
  '💝',
  '🎈',
  '🎊',
  '🌈',
];

export default function CommentSection<T extends BaseComment>({
  comments,
  resourceId,
  resourceType,
}: CommentSectionProps<T>) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(
    null
  );
  const [reactions, setReactions] = useState<Record<string, CommentReaction[]>>(
    {}
  );
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Sort comments by date (newest first)
  const sortedComments = [...comments].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Calculate pagination
  const totalComments = sortedComments.length;
  const totalPages = Math.ceil(totalComments / COMMENTS_PER_PAGE);
  const startIndex = (currentPage - 1) * COMMENTS_PER_PAGE;
  const endIndex = Math.min(startIndex + COMMENTS_PER_PAGE, totalComments);
  const paginatedComments = sortedComments.slice(startIndex, endIndex);

  // Helper function to get comment content safely
  const getCommentContent = (comment: T) => {
    return (comment as any)[resourceType.contentField] || '';
  };

  // Helper function to get user ID safely
  const getCommentUserId = (comment: T) => {
    return (comment as any)[resourceType.userField] || '';
  };

  useEffect(() => {
    async function initializeUser() {
      try {
        const user = await getCurrentUser();
        setCurrentUserId(user?.id || null);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    }
    initializeUser();
  }, []);

  useEffect(() => {
    async function fetchReactions() {
      if (!comments.length) return;

      try {
        const commentIds = comments.map((c) => c.id);
        const reactionData = await getReactions(commentIds);

        const reactionsByComment = reactionData.reduce<
          Record<string, CommentReaction[]>
        >((acc, reaction) => {
          if (!acc[reaction.comment_id]) {
            acc[reaction.comment_id] = [];
          }
          acc[reaction.comment_id].push(reaction);
          return acc;
        }, {});

        setReactions(reactionsByComment);
      } catch (err) {
        console.error('Error fetching reactions:', err);
        setError('Failed to load reactions');
      }
    }

    fetchReactions();
  }, [comments]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const content = formData.get('content') as string;

      await addComment(content, resourceId, resourceType);
      form.reset();
      router.refresh();
    } catch (err) {
      console.error('Error adding comment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add comment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = async (
    commentId: string,
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const content = formData.get('content') as string;

      await updateComment(commentId, content, currentUserId!, resourceType);
      setEditingComment(null);
      router.refresh();
    } catch (err) {
      console.error('Error updating comment:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update comment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      setIsSubmitting(true);
      await deleteComment(commentId, resourceType);
      router.refresh();
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete comment. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
      setSelectedCommentId(null);
    }
  };

  const handleReactionClick = async (commentId: string, emoji: string) => {
    try {
      const existingReaction = reactions[commentId]?.find(
        (r) => r.user_id === currentUserId && r.emoji === emoji
      );

      if (existingReaction) {
        await deleteReaction(existingReaction.id);
        setReactions((prev) => ({
          ...prev,
          [commentId]: prev[commentId].filter(
            (r) => r.id !== existingReaction.id
          ),
        }));
      } else {
        const newReaction = await addReaction(commentId, emoji as EmojiType);
        if (newReaction) {
          setReactions((prev) => ({
            ...prev,
            [commentId]: [
              ...(prev[commentId] || []),
              newReaction,
            ] as CommentReaction[],
          }));
        }
      }

      setShowEmojiPicker(null);
    } catch (err) {
      console.error('Error handling reaction:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update reaction. Please try again.'
      );
    }
  };

  const getReactionCounts = (commentId: string): EmojiCount[] => {
    const commentReactions = reactions[commentId] || [];
    const emojiCounts: Record<string, EmojiCount> = {};

    commentReactions.forEach((reaction) => {
      if (!emojiCounts[reaction.emoji]) {
        emojiCounts[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      emojiCounts[reaction.emoji].count++;
      emojiCounts[reaction.emoji].users.push({
        user_id: reaction.user_id,
        email: reaction.user.email,
        full_name: reaction.user.full_name,
      });
    });

    return Object.values(emojiCounts);
  };

  const hasUserReacted = (commentId: string, emoji: string) => {
    return reactions[commentId]?.some(
      (r) => r.user_id === currentUserId && r.emoji === emoji
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
      <div className="px-5 py-4">
        <h2 className="font-semibold text-slate-600 dark:text-slate-100 mb-4">
          Comments and Updates
        </h2>

        {/* Comment List */}
        <div className="space-y-4 mb-6">
          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/50 p-4 mb-4">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          {paginatedComments.map((comment) => (
            <div
              key={comment.id}
              className="flex space-x-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
            >
              <div className="flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full ${getUserColor(
                    getCommentUserId(comment)
                  )} flex items-center justify-center`}
                >
                  <span className="text-sm font-medium text-white">
                    {comment.user?.full_name?.charAt(0).toUpperCase() ||
                      comment.user?.email?.charAt(0).toUpperCase() ||
                      '?'}
                  </span>
                </div>
              </div>
              <div className="flex-grow">
                {editingComment === comment.id ? (
                  <form
                    onSubmit={(e) => handleCommentUpdate(comment.id, e)}
                    className="space-y-2"
                  >
                    <Textarea
                      name="content"
                      defaultValue={getCommentContent(comment)}
                      required
                      rows={2}
                      className="block w-full"
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setEditingComment(null)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        Save
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-100">
                        {comment.user?.full_name || comment.user?.email}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {format(
                          new Date(comment.created_at),
                          'MMM d, yyyy h:mm a'
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                      {getCommentContent(comment)}
                    </div>

                    {currentUserId === getCommentUserId(comment) && (
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => setEditingComment(comment.id)}
                          className="text-sm font-medium text-coop-600 hover:text-coop-700 dark-text-sky-400 dark:hover:text-coop-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCommentId(comment.id);
                            setShowDeleteDialog(true);
                          }}
                          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}

                    {/* Reactions */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Popover
                          open={showEmojiPicker === comment.id}
                          onOpenChange={(open) =>
                            setShowEmojiPicker(open ? comment.id : null)
                          }
                        >
                          <PopoverTrigger asChild>
                            <button
                              className={`text-xs sm:text-sm flex items-center gap-1 font-bold ${
                                hasUserReacted(comment.id, '👍')
                                  ? 'text-slate-400 dark:text-slate-300'
                                  : 'text-slate-400 dark:text-slate-300'
                              } hover:text-slate-500 dark:hover:text-slate-200`}
                            >
                              <span>Like</span>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[240px] xs:w-[280px] sm:w-[320px] p-2"
                            side="top"
                            align="start"
                            sideOffset={5}
                          >
                            <div className="grid grid-cols-5 xs:grid-cols-6 sm:grid-cols-8 gap-1">
                              {EMOJI_LIST.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => {
                                    handleReactionClick(comment.id, emoji);
                                    setShowEmojiPicker(null);
                                  }}
                                  className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors hover:scale-110 aspect-square flex items-center justify-center"
                                >
                                  <span className="text-lg sm:text-xl">
                                    {emoji}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                        {getReactionCounts(comment.id).map(
                          ({ emoji, count, users }) => (
                            <Popover key={emoji}>
                              <PopoverTrigger asChild>
                                <button
                                  onClick={() =>
                                    handleReactionClick(comment.id, emoji)
                                  }
                                  className={`inline-flex items-center space-x-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm ${
                                    hasUserReacted(comment.id, emoji)
                                      ? 'bg-white text-black dark:bg-slate-700 dark:text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                                  } hover:bg-slate-200 transition-colors`}
                                >
                                  <span>{emoji}</span>
                                  <span>{count}</span>
                                </button>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-[200px] sm:w-[240px] p-2"
                                side="top"
                                align="start"
                              >
                                <div className="text-xs sm:text-sm font-medium mb-1">
                                  Reacted with {emoji}
                                </div>
                                <div className="space-y-1">
                                  {users.map((user) => (
                                    <div
                                      key={user.user_id}
                                      className="text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                                    >
                                      {user.full_name || user.email}
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          {comments.length === 0 && (
            <div className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              No comments yet
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {startIndex + 1} to {endIndex} of {totalComments} comments
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Comment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="content" className="sr-only">
              Add a comment
            </label>
            <Textarea
              name="content"
              id="content"
              rows={3}
              required
              className="mt-1 block w-full"
              placeholder="Add a comment..."
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Comment'}
            </Button>
          </div>
        </form>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                comment.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isSubmitting}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  selectedCommentId && handleDeleteComment(selectedCommentId)
                }
                disabled={isSubmitting}
                className="bg-red-600 text-white hover:bg-red-700 dark:hover:bg-red-700 dark:bg-red-600"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Comment'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
