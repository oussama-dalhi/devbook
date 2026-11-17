import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';

type DeletePostButtonProps = {
  postId: number;
  onError: (message: string) => void;
  label?: string;
};

export const DeletePostButton = ({
  postId,
  onError,
  label,
}: DeletePostButtonProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const deletePost = useMutation({
    mutationFn: () => request(`/posts/${postId}`, { method: 'DELETE' }),
    onMutate: () => onError(''),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.posts }),
    onError: (error) => onError(error.message),
    onSettled: () => setOpen(false),
  });

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="sm" aria-label={label} />}
      >
        Delete
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePost.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deletePost.isPending}
            onClick={() => deletePost.mutate()}
          >
            {deletePost.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
