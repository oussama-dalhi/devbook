import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, Outlet } from 'react-router';
import { Button } from '@/components/ui/button';
import { useMe } from '@/features/auth/useMe';
import { request } from '@/lib/api';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Layout = () => {
  const queryClient = useQueryClient();
  const { data: user, isPending } = useMe();

  const logout = useMutation({
    mutationFn: () =>
      request<{ message: string }>('/auth/logout', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(['me'], null),
  });

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link to="/" className="text-xl font-semibold tracking-tight">
            Dev<span className="text-primary">book</span>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            {isPending ? null : user ? (
              <>
                <span className="hidden text-muted-foreground sm:inline">
                  {user.name}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={logout.isPending}
                  onClick={() => logout.mutate()}
                >
                  Log out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register">Sign up</Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
};
