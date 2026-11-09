import { Link } from 'react-router';

export const NotFoundPage = () => {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground">
        The page you're looking for doesn't exist.
      </p>
      <Link to="/" className="underline">
        Back to the feed
      </Link>
    </div>
  );
};