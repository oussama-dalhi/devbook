import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const STORAGE_KEY = 'guest-prompt-dismissed';
const DELAY_MS = 6000;

const wasDismissed = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const GuestPrompt = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (wasDismissed()) return;
    const timer = setTimeout(() => setOpen(true), DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // storage can be unavailable (private mode);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join Devbook</DialogTitle>
          <DialogDescription>
            Log in or sign up to share what you're working on.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <Link
            to="/register"
            className={buttonVariants()}
            onClick={() => handleOpenChange(false)}
          >
            Sign up
          </Link>
          <Link
            to="/login"
            className={buttonVariants({ variant: 'outline' })}
            onClick={() => handleOpenChange(false)}
          >
            Log in
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
};
