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

type DeletePostButtonProps = {
  postId: number;
};

export const DeletePostButton = ({ postId }: DeletePostButtonProps) => {
  const queryClient = useQueryClient();

  const deletePost = useMutation({
    mutationFn: () => request(`/posts/${postId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger render={<Button variant="ghost" size="sm" />}>
          Delete
        </AlertDialogTrigger>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => deletePost.mutate()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {deletePost.isError && (
        <p role="alert" className="text-xs text-destructive">
          {deletePost.error.message}
        </p>
      )}
    </>
  );
};
