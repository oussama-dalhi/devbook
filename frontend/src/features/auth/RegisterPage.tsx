import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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

const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(100),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'At least 3 characters')
    .max(30, 'At most 30 characters')
    .regex(/^[a-z0-9_-]+$/, 'Only letters, numbers, underscores and hyphens'),
  email: z
    .string()
    .trim()
    .max(254)
    .pipe(z.email({ error: 'Enter a valid email address' })),
  password: z.string().min(8, 'At least 8 characters').max(100),
});
type RegisterValues = z.infer<typeof registerSchema>;

const fields: {
  name: keyof RegisterValues;
  label: string;
  type?: string;
  autoComplete: string;
}[] = [
  { name: 'name', label: 'Name', autoComplete: 'name' },
  { name: 'username', label: 'Username', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    autoComplete: 'new-password',
  },
];

export const RegisterPage = () => {
  const navigate = useNavigate();

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', username: '', email: '', password: '' },
  });

  const register = useMutation({
    mutationFn: (values: RegisterValues) =>
      request<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(values),
      }),
    onSuccess: () => navigate('/login'),
  });

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-xl font-semibold">Sign up</h1>

      <form
        onSubmit={form.handleSubmit((values) => register.mutate(values))}
        noValidate
      >
        <FieldGroup>
          {fields.map(({ name, label, type, autoComplete }) => (
            <Controller
              key={name}
              name={name}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type={type ?? 'text'}
                    autoComplete={autoComplete}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          ))}

          {register.isError && (
            <p role="alert" className="text-sm text-destructive">
              {register.error.message}
            </p>
          )}

          <Button type="submit" disabled={register.isPending}>
            {register.isPending ? 'Creating account…' : 'Sign up'}
          </Button>
        </FieldGroup>
      </form>

      <p className="text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="underline">
          Log in
        </Link>
      </p>
    </div>
  );
};
