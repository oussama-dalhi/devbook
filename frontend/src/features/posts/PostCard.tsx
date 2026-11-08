import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMe } from '@/features/auth/useMe';
import { DeletePostButton } from './DeletePostButton';
import { EditPostForm } from './EditPostForm';
import type { Post } from './types';
import { formatDateTime } from '@/lib/format';

type PostCardProps = {
  post: Post;
};

export const PostCard = ({ post }: PostCardProps) => {
  const { data: user } = useMe();
  const [isEditing, setIsEditing] = useState(false);
  const isOwner = user?.id === post.author.id;

  const isEdited =
    new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
    1000;
  const shownDate = isEdited ? post.updatedAt : post.createdAt;

  return (
    <Card className="gap-0 py-0 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="flex flex-row items-center gap-3 px-5 pt-5 pb-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-semibold">
          {post.author.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="text-sm font-semibold">{post.author.name}</p>
          <p className="text-xs text-muted-foreground">
            @{post.author.username} · {isEdited && 'Edited '}
            <time dateTime={shownDate}>{formatDateTime(shownDate)}</time>
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              disabled={isEditing}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <DeletePostButton postId={post.id} />
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        {isEditing ? (
          <EditPostForm post={post} onDone={() => setIsEditing(false)} />
        ) : (
          <>
            {post.title && (
              <CardTitle className="text-lg font-semibold tracking-tight">
                {post.title}
              </CardTitle>
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
                className="max-h-120 w-full rounded-lg border object-contain"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
