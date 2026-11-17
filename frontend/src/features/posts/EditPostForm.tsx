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
import { queryKeys } from '@/lib/queryKeys';
import {
  POST_CONTENT_MAX_LENGTH,
  POST_TITLE_MAX_LENGTH,
  postFieldsSchema,
  type PostFieldsValues,
} from './postSchema';
import type { Post } from './types';

const fields: {
  name: keyof PostFieldsValues;
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

  const original: PostFieldsValues = {
    title: post.title ?? '',
    content: post.content ?? '',
  };

  const form = useForm<PostFieldsValues>({
    resolver: zodResolver(postFieldsSchema),
    defaultValues: original,
  });

  const editPost = useMutation({
    mutationFn: (payload: Record<string, string>) =>
      request(`/posts/${post.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.posts });
      onDone();
    },
  });

  const onSubmit = (values: PostFieldsValues) => {
    let blocked = false;
    for (const key of ['title', 'content'] as const) {
      if (original[key] && values[key] === '') {
        form.setError(key, { message: "This field can't be cleared" });
        blocked = true;
      }
    }
    if (blocked) return;

    const changed = Object.fromEntries(
      Object.entries(values).filter(
        ([key, value]) =>
          value !== '' && value !== original[key as keyof PostFieldsValues],
      ),
    );

    if (Object.keys(changed).length === 0) {
      onDone();
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
                    className="max-h-80 min-h-24 overflow-y-auto"
                    maxLength={POST_CONTENT_MAX_LENGTH}
                    aria-invalid={fieldState.invalid}
                  />
                ) : (
                  <Input
                    {...field}
                    id={`edit-${post.id}-${field.name}`}
                    maxLength={POST_TITLE_MAX_LENGTH}
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
