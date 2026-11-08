import { useEffect, useRef } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { getPosts } from './api';
import { PostCard } from './PostCard';
import { useMe } from '@/features/auth/useMe';
import { CreatePostForm } from './CreatePostForm';

export const FeedPage = () => {
  const {
    data,
    isPending,
    isError,
    error,
    isFetching,
    isFetchNextPageError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => getPosts(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage
        ? lastPage.pagination.page + 1
        : undefined,
  });

  const sentinelRef = useRef<HTMLDivElement>(null);
  const { data: user } = useMe();

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetching || isFetchNextPageError) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '200px' },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchNextPageError, isFetching]);

  if (isPending) {
    return (
      <p className="py-8 text-center text-muted-foreground">Loading posts...</p>
    );
  }
  if (isError && !data) {
    return (
      <div className="space-y-3 py-8 text-center">
        <p className="text-destructive">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    );
  }
  const posts = data.pages.flatMap((page) => page.posts);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
      {user && <CreatePostForm />}

      {/* Empty state */}
      {posts.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          No posts yet. Be the first to share something!
        </p>
      )}

      {/* Posts */}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {/* Infinite scroll trigger */}
      {hasNextPage && <div ref={sentinelRef} aria-hidden="true" />}

      {/* Loading next page */}
      {isFetchingNextPage && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Loading more posts...
        </p>
      )}

      {/* Next-page error */}
      {isFetchNextPageError && (
        <div className="space-y-3 py-4 text-center">
          <p className="text-sm text-destructive">Couldn't load more posts.</p>
          <Button
            variant="outline"
            disabled={isFetching}
            onClick={() => fetchNextPage()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* End of feed */}
      {!hasNextPage && posts.length > 0 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          You've reached the end of the feed.
        </p>
      )}
    </div>
  );
};
