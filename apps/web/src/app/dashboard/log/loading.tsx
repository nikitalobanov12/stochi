import { Skeleton } from "~/components/ui/skeleton";

export default function LogLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-5 w-12" />
        <Skeleton className="mt-1 h-3 w-24" />
      </div>

      {/* Command Bar */}
      <div className="glass-card p-3">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Quick Log Stacks */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </div>

      {/* Today's Activity */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="glass-card flex items-center justify-between px-3 py-2"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="space-y-4">
          {[1, 2].map((group) => (
            <div key={group}>
              <Skeleton className="mb-2 h-3 w-20" />
              <div className="space-y-1">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-card flex items-center justify-between px-3 py-1.5"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Skeleton className="h-3 w-10" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-3 w-12" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
