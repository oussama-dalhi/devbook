import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { DeletePostButton } from './DeletePostButton';
import { EditPostForm } from './EditPostForm';
import type { Post } from './types';
import { formatDateTime, formatRelativeTime } from '@/lib/format';

type PostCardProps = {
  post: Post;
  currentUserId?: number;
};

export const PostCard = ({ post, currentUserId }: PostCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = currentUserId === post.author.id;
  const [deleteError, setDeleteError] = useState('');

  const isEdited =
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
    1000;
  const shownDate = isEdited ? post.updatedAt : post.createdAt;

  return (
    <Card className="gap-0 rounded-sm py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 px-6 pt-5 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
          {post.author.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">
            @{post.author.username} · {isEdited && 'Edited '}
            <time dateTime={shownDate} title={formatDateTime(shownDate)}>
              {formatRelativeTime(shownDate)}
            </time>
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Edit post by ${post.author.name}`}
              disabled={isEditing}
              onClick={() => {
                setDeleteError('');
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
            <DeletePostButton
              postId={post.id}
              onError={setDeleteError}
              label={`Delete post by ${post.author.name}`}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        {deleteError && (
          <p role="alert" className="text-sm text-destructive">
            {deleteError}
          </p>
        )}
        {isEditing ? (
          <EditPostForm post={post} onDone={() => setIsEditing(false)} />
        ) : (
          <>
            {post.title && (
              <h2 className="text-lg font-semibold tracking-tight">
                {post.title}
              </h2>
            )}

            {post.content && (
              <p className="text-base leading-relaxed whitespace-pre-wrap wrap-break-word">
                {post.content}
              </p>
            )}

            {post.imageUrl && (
              <img
                src={post.imageUrl}
                alt={`Image shared by ${post.author.name}`}
                loading="lazy"
                className="rounded-sm border max-h-120 w-full object-contain"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
