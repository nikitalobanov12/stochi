import { Skeleton } from "~/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-1 h-5 w-32" />
      </div>

      {/* Profile Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-14" />
        <div className="glass-card p-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-3">
              <div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1 h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Goals Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-12" />
        <div className="glass-card p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-8 w-20 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Suggestions Section */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="glass-card p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-9 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Data Stats */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3">
            <Skeleton className="h-7 w-16" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
          <div className="glass-card p-3">
            <Skeleton className="h-7 w-8" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        </div>
      </section>

      {/* Data Export */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-3" />
        </div>
        <div className="glass-card p-4">
          <div className="space-y-3">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32 rounded-md" />
              <Skeleton className="h-9 w-32 rounded-md" />
            </div>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <div className="rounded-lg border border-white/10 p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <section className="pt-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </section>
    </div>
  );
}
