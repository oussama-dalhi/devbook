import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { User } from '@/features/auth/useMe';
import { request } from '@/lib/api';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/utils';
import {
  POST_CONTENT_MAX_LENGTH,
  postFieldsSchema,
  type PostFieldsValues,
} from './postSchema';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreatePostForm = ({ user }: { user: User }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const form = useForm<PostFieldsValues>({
    resolver: zodResolver(postFieldsSchema),
    defaultValues: { title: '', content: '' },
  });

  // Clean up the image preview URL when it changes or the form unmounts.
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  const selectImage = (file?: File) => {
    setImageError('');

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setImageError('Only JPEG, PNG and WebP images are allowed.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setImageError('Image must be smaller than 5 MB.');
      return;
    }

    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImage(null);
    setPreview(null);
    setImageError('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const createPost = useMutation({
    mutationFn: async (values: PostFieldsValues) => {
      const content = values.content.trim();
      const title = values.title.trim();

      if (!content && !image) {
        throw new Error('Write something or add an image.');
      }

      const formData = new FormData();

      if (title) formData.append('title', title);
      if (content) formData.append('content', content);
      if (image) formData.append('image', image);

      return request('/posts', {
        method: 'POST',
        body: formData,
      });
    },
    onSuccess: () => {
      form.reset();
      removeImage();
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: queryKeys.posts });
    },
  });

  const closeForm = () => {
    form.reset();
    createPost.reset();
    removeImage();
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <Card className="flex-row items-center justify-between gap-3 rounded-sm p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold">
            Hello, {user.name.split(' ')[0]}
          </p>
          <p className="text-xs text-muted-foreground">
            What are you working on?
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)}>Create post</Button>
      </Card>
    );
  }

  return (
    <Card className="rounded-sm p-0 shadow-sm">
      <form
        onSubmit={form.handleSubmit((values) => createPost.mutate(values))}
        noValidate
        className="p-6"
      >
        <FieldGroup>
          <Controller
            name="title"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Title (optional)</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="content"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  What are you working on?
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  className="max-h-80 min-h-36 overflow-y-auto"
                  autoFocus
                  maxLength={POST_CONTENT_MAX_LENGTH}
                  aria-invalid={fieldState.invalid}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();

                      if (!createPost.isPending) {
                        void form.handleSubmit((values) =>
                          createPost.mutate(values),
                        )();
                      }
                    }
                  }}
                />
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {field.value.length} / {POST_CONTENT_MAX_LENGTH}
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Ctrl + Enter to post
                  </span>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {/* Image upload */}
          <Field>
            <FieldLabel htmlFor="post-image">Image (optional)</FieldLabel>

            <input
              ref={fileInputRef}
              id="post-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="peer sr-only"
              onChange={(event) => selectImage(event.target.files?.[0])}
            />

            {preview ? (
              <div className="relative overflow-hidden rounded-sm border">
                <img
                  src={preview}
                  alt="Selected image preview"
                  className="max-h-80 w-full object-contain"
                />

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeImage}
                >
                  Remove image
                </Button>
              </div>
            ) : (
              <label
                htmlFor="post-image"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  // Ignore leave events caused by moving over child elements
                  if (
                    !event.currentTarget.contains(
                      event.relatedTarget as Node | null,
                    )
                  ) {
                    setIsDragging(false);
                  }
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                  selectImage(event.dataTransfer.files[0]);
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center rounded-sm border-2 border-dashed p-8 text-center transition-colors',
                  'peer-focus-visible:border-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring/50',
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary',
                )}
              >
                <p className="text-sm font-medium">
                  Drop an image here or click to browse
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPEG, PNG or WebP · Maximum 5 MB
                </p>
              </label>
            )}

            {imageError && (
              <p role="alert" className="text-sm text-destructive">
                {imageError}
              </p>
            )}
          </Field>

          {createPost.isError && (
            <p role="alert" className="text-sm text-destructive">
              {createPost.error.message}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={createPost.isPending}>
              {createPost.isPending ? 'Posting…' : 'Post'}
            </Button>

            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </FieldGroup>
      </form>
    </Card>
  );
};