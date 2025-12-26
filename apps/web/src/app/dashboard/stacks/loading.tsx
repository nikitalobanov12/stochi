import { Skeleton } from "~/components/ui/skeleton";

export default function StacksLoading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-24" />
          <Skeleton className="mt-1 h-3 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Your Protocols Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />

        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card px-4 py-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left side - Stack info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-6 rounded-md" />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="hidden h-3 w-40 sm:block" />
                  </div>
                </div>

                {/* Right side - Actions */}
                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <Skeleton className="h-3 w-16" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-14 rounded-md" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Protocols Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-44" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-12 rounded-full" />
                    <Skeleton className="h-4 w-16 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
