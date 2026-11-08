import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { request } from '@/lib/api';
import { createPostSchema, type CreatePostValues } from './postSchema';
import type { Post } from './types';

const fields: {
  name: keyof CreatePostValues;
  label: string;
  multiline?: boolean;
}[] = [
  { name: 'title', label: 'Title (optional)' },
  { name: 'content', label: 'Content', multiline: true },
];

type EditPostFormProps = {
  post: Post;
  onDone: () => void;
};

export const EditPostForm = ({ post, onDone }: EditPostFormProps) => {
  const queryClient = useQueryClient();

  const original: CreatePostValues = {
    title: post.title ?? '',
    content: post.content ?? '',
  };

  const form = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: original,
  });

  const editPost = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      request(`/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      onDone();
    },
  });

  const onSubmit = (values: CreatePostValues) => {
    // The API rejects empty strings, so send only fields with a new, non-empty value
    const changed = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) =>
          value !== '' && value !== original[key as keyof CreatePostValues],
      ),
    );

    if (Object.keys(changed).length === 0) {
      onDone(); // nothing changed, so skip the request
      return;
    }
    editPost.mutate(changed);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        {fields.map(({ name, label, multiline }) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`edit-${post.id}-${field.name}`}>
                  {label}
                </FieldLabel>
                {multiline ? (
                  <Textarea
                    {...field}
                    id={`edit-${post.id}-${field.name}`}
                    rows={3}
                    aria-invalid={fieldState.invalid}
                  />
                ) : (
                  <Input
                    {...field}
                    id={`edit-${post.id}-${field.name}`}
                    aria-invalid={fieldState.invalid}
                  />
                )}
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}

        {editPost.isError && (
          <p role="alert" className="text-sm text-destructive">
            {editPost.error.message}
          </p>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={editPost.isPending}>
            {editPost.isPending ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};
