import { useEffect, useRef, useState } from 'react';
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
import {
  createPostSchema,
  type CreatePostValues,
  POST_CONTENT_MAX_LENGTH,
} from './postSchema';
import { useMe } from '@/features/auth/useMe';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const CreatePostForm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: user } = useMe();
  const queryClient = useQueryClient();

  const form = useForm<CreatePostValues>({
    resolver: zodResolver(createPostSchema),
    defaultValues: { title: '', content: '' },
  });

  // Create and clean up the image preview URL.
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
    mutationFn: async (values: CreatePostValues) => {
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
      setImage(null);
      setPreview(null);
      setImageError('');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['posts'] });
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
      <div className="flex items-center justify-between gap-3 rounded-sm border bg-card p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold">
            Hello, {user?.name.split(' ')[0]}
          </p>
          <p className="text-xs text-muted-foreground">
            What are you working on?
          </p>
        </div>

        <Button onClick={() => setIsOpen(true)}>Create post</Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit((values) => createPost.mutate(values))}
      noValidate
      className="rounded-sm border bg-card p-5"
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                rows={10}
                className="min-h-36 resize-y"
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
            <div className="relative overflow-hidden border">
              <img
                src={preview}
                alt="Selected image preview"
                className="max-h-80 w-full object-contain"
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute right-2 top-2"
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
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                selectImage(event.dataTransfer.files[0]);
              }}
              className={cn(
                `flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary'
                }`,
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
  );
};
