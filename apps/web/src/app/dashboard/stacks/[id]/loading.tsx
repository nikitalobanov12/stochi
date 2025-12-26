import { Skeleton } from "~/components/ui/skeleton";

export default function StackDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-4" />
        <div className="flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="mt-1 h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>

      {/* Supplements Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>

        <div className="glass-card">
          <ul className="divide-border/40 divide-y">
            {[1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="mt-1 h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Interactions Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="glass-card p-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-36" />
          </div>
        </div>
      </section>

      {/* Settings Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-16" />
        <div className="glass-card p-3">
          <div className="flex gap-2">
            <Skeleton className="h-8 flex-1 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="rounded-lg border border-white/10 p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-44" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>
      </section>
    </div>
  );
}
