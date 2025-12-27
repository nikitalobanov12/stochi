import { Skeleton } from "~/components/ui/skeleton";

export default function ProtocolLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-1 h-3 w-24" />
        </div>
        <Skeleton className="h-9 w-24 rounded-md" />
      </div>

      {/* Time Slots */}
      {[1, 2, 3, 4].map((slot) => (
        <section key={slot} className="space-y-3">
          {/* Slot Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div>
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-1 h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-6 rounded-md" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-md" />
              <Skeleton className="h-8 w-14 rounded-md" />
            </div>
          </div>

          {/* Items */}
          <div className="space-y-2">
            {slot <= 2 &&
              [1, 2].map((item) => (
                <div key={item} className="glass-card flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-4 w-4" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-5 w-16 rounded-md" />
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-20 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            {slot > 2 && (
              <div className="border-border/40 rounded-lg border border-dashed py-8 text-center">
                <Skeleton className="mx-auto h-3 w-48" />
              </div>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
