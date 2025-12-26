import { Skeleton } from "~/components/ui/skeleton";
import { BioScoreCardSkeleton } from "~/components/dashboard/bio-score-card";
import { MicroKPIRowSkeleton } from "~/components/dashboard/micro-kpi-row";
import {
  BiologicalTimelineSkeleton,
  ActiveCompoundsListSkeleton,
} from "~/components/dashboard/biological-timeline";
import { OptimizationHUDSkeleton } from "~/components/dashboard/optimization-hud";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* System Status Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Command Bar Skeleton */}
      <div className="glass-card p-3">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>

      {/* Protocols Section Skeleton */}
      <section className="space-y-3">
        <Skeleton className="h-3 w-20" />
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-stretch rounded-xl border border-white/10 bg-[#0A0A0A]"
            >
              <div className="flex flex-1 items-center gap-3 px-4 py-3">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="w-px bg-white/10" />
              <div className="flex items-center px-2">
                <Skeleton className="h-11 w-[72px] rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Main Content: 12-Column Bento Grid Layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Column: Timeline + HUD (8 cols) */}
        <div className="space-y-4 lg:col-span-8">
          {/* Biological Timeline */}
          <div>
            <Skeleton className="mb-3 h-3 w-32" />
            <div className="glass-card p-4">
              <BiologicalTimelineSkeleton />
            </div>
          </div>

          {/* Optimization HUD */}
          <div>
            <Skeleton className="mb-3 h-3 w-28" />
            <OptimizationHUDSkeleton />
          </div>

          {/* Live Console Feed Skeleton */}
          <div className="glass-card space-y-2 p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-3 w-24" />
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-2 py-1">
                <Skeleton className="mt-0.5 h-3 w-12" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Bio-Score + KPIs + Compounds (4 cols) */}
        <div className="space-y-4 lg:col-span-4">
          {/* Bio-Score Card */}
          <BioScoreCardSkeleton />

          {/* Micro-KPI Row */}
          <div>
            <Skeleton className="mb-3 h-3 w-20" />
            <div className="glass-card p-4">
              <MicroKPIRowSkeleton />
            </div>
          </div>

          {/* Active Compounds List */}
          <div>
            <Skeleton className="mb-3 h-3 w-28" />
            <div className="glass-card p-4">
              <ActiveCompoundsListSkeleton />
            </div>
          </div>
        </div>
      </div>

      {/* Activity Log Skeleton */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card flex items-center justify-between px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-10" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
