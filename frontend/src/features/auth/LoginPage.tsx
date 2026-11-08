// src/features/auth/LoginPage.tsx
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { request } from '@/lib/api';
import type { User } from './useMe';

const loginSchema = z.object({
  identifier: z.string().trim().min(3, 'Enter your username or email').max(254),
  password: z.string().min(8, 'At least 8 characters').max(100),
});
type LoginValues = z.infer<typeof loginSchema>;

export const LoginPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

  const login = useMutation({
    mutationFn: (values: LoginValues) =>
      request<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: ({ user }) => {
      queryClient.setQueryData(['me'], user);
      navigate('/');
    },
  });

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Log in</h1>

      <form
        onSubmit={form.handleSubmit((values) => login.mutate(values))}
        noValidate
      >
        <FieldGroup>
          <Controller
            name="identifier"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Username or email</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  autoComplete="username"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name="password"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {login.isError && (
            <p role="alert" className="text-sm text-destructive">
              {login.error.message}
            </p>
          )}

          <Button type="submit" disabled={login.isPending}>
            {login.isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-muted-foreground">
        No account?{' '}
        <Link to="/register" className="underline">
          Sign up
        </Link>
      </p>
    </div>
  );
};
