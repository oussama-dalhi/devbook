import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type PostSkeletonProps = {
  withImage?: boolean;
  withTitle?: boolean;
};

export const PostSkeleton = ({
  withImage = false,
  withTitle = true,
}: PostSkeletonProps) => {
  return (
    <Card className="gap-0 rounded-sm py-0 shadow-sm" aria-hidden="true">
      <CardHeader className="flex flex-row items-center gap-3 px-6 pt-5 pb-3">
        <Skeleton className="size-10 shrink-0 rounded-full" />

        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-6">
        {withTitle && <Skeleton className="h-5 w-2/3" />}

        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/5" />
        </div>

        {withImage && <Skeleton className="h-64 max-h-120 w-full rounded-sm" />}
      </CardContent>
    </Card>
  );
};
