"use client";

import { useMemo } from "react";
import { AlertTriangle, Zap, Shield } from "lucide-react";
import type { ExclusionZone, OptimizationOpportunity } from "~/server/services/biological-state";

// ============================================================================
// Types
// ============================================================================

type BioScoreHeroProps = {
  score: number;
  exclusionZones: ExclusionZone[];
  optimizations: OptimizationOpportunity[];
};

// ============================================================================
// Score Configuration
// ============================================================================

type ScoreLevel = {
  label: string;
  colorClass: string;
  gaugeColor: string;
  bgGlow: string;
};

function getScoreLevel(score: number): ScoreLevel {
  if (score >= 80) {
    return {
      label: "OPTIMAL",
      colorClass: "status-optimized",
      gaugeColor: "#10B981", // Emerald
      bgGlow: "rgba(16, 185, 129, 0.15)",
    };
  }
  if (score >= 60) {
    return {
      label: "GOOD",
      colorClass: "status-info",
      gaugeColor: "#06B6D4", // Cyan
      bgGlow: "rgba(6, 182, 212, 0.15)",
    };
  }
  if (score >= 40) {
    return {
      label: "MODERATE",
      colorClass: "status-conflict",
      gaugeColor: "#F59E0B", // Amber
      bgGlow: "rgba(245, 158, 11, 0.15)",
    };
  }
  return {
    label: "SUBOPTIMAL",
    colorClass: "status-critical",
    gaugeColor: "#EF4444", // Red
    bgGlow: "rgba(239, 68, 68, 0.15)",
  };
}

// ============================================================================
// Semi-Circular Gauge SVG Component
// ============================================================================

function SemiCircularGauge({ 
  score, 
  size = 120,
}: { 
  score: number; 
  size?: number;
}) {
  // SVG arc calculations for semi-circle (180 degrees)
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = size / 2 + 10; // Offset down slightly for visual balance
  
  // Arc path for semi-circle (180 degrees, left to right)
  const circumference = Math.PI * radius; // Half circle
  const progress = Math.min(Math.max(score, 0), 100) / 100;
  const strokeDashoffset = circumference * (1 - progress);
  
  // Stable gradient ID using score (deterministic)
  const gradientId = "bio-score-gradient";
  
  return (
    <svg 
      width={size} 
      height={size / 2 + 20} 
      viewBox={`0 0 ${size} ${size / 2 + 20}`}
      className="overflow-visible"
    >
      <defs>
        {/* Gradient for the progress arc */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="33%" stopColor="#F59E0B" />
          <stop offset="66%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#10B981" />
        </linearGradient>
        
        {/* Glow filter */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background arc (track) */}
      <path
        d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
        fill="none"
        stroke="rgba(255, 255, 255, 0.08)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Progress arc */}
      <path
        d={`M ${strokeWidth / 2} ${centerY} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${centerY}`}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        filter="url(#glow)"
        style={{ transition: "stroke-dashoffset 0.5s ease-out" }}
      />
      
      {/* Score text */}
      <text
        x={centerX}
        y={centerY - 8}
        textAnchor="middle"
        className="font-mono text-3xl font-bold"
        fill="white"
      >
        {Math.round(score)}
      </text>
      
      {/* "BIO-SCORE" label */}
      <text
        x={centerX}
        y={centerY + 12}
        textAnchor="middle"
        className="font-mono text-[9px] tracking-widest uppercase"
        fill="rgba(255, 255, 255, 0.5)"
      >
        BIO-SCORE
      </text>
    </svg>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function BioScoreHero({
  score,
  exclusionZones,
  optimizations,
}: BioScoreHeroProps) {
  const level = useMemo(() => getScoreLevel(score), [score]);
  
  // Count conflicts and synergies
  const stats = useMemo(() => {
    const conflicts = exclusionZones.filter(
      (z) => z.severity === "critical" || z.severity === "medium"
    ).length;
    
    const synergies = optimizations.filter(
      (o) => o.type === "synergy" && o.title.startsWith("Active synergy")
    ).length;
    
    const pendingWindows = exclusionZones.filter(
      (z) => z.minutesRemaining > 0
    ).length;
    
    return { conflicts, synergies, pendingWindows };
  }, [exclusionZones, optimizations]);

  return (
    <div 
      className="glass-card relative overflow-hidden p-4"
      style={{ 
        background: `linear-gradient(135deg, ${level.bgGlow} 0%, transparent 50%)` 
      }}
    >
      {/* Ambient glow effect */}
      <div 
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl"
        style={{ backgroundColor: level.bgGlow }}
      />
      
      <div className="relative flex items-center gap-4">
        {/* Gauge */}
        <div className="shrink-0">
          <SemiCircularGauge 
            score={score} 
            size={120}
          />
        </div>
        
        {/* Status & Stats */}
        <div className="flex-1 space-y-3">
          {/* Status Label */}
          <div className="flex items-center gap-2">
            <div 
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: level.gaugeColor }}
            />
            <span className={`font-mono text-xs font-medium tracking-wider ${level.colorClass}`}>
              {level.label}
            </span>
          </div>
          
          {/* Stats Row */}
          <div className="flex flex-wrap gap-3">
            {/* Conflicts */}
            <div className="flex items-center gap-1.5">
              {stats.conflicts > 0 ? (
                <AlertTriangle className="h-3.5 w-3.5 status-conflict" />
              ) : (
                <Shield className="h-3.5 w-3.5 status-optimized" />
              )}
              <span className="font-mono text-xs text-white/70">
                {stats.conflicts === 0 ? "No conflicts" : `${stats.conflicts} conflict${stats.conflicts !== 1 ? "s" : ""}`}
              </span>
            </div>
            
            {/* Synergies */}
            {stats.synergies > 0 && (
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 status-optimized" />
                <span className="font-mono text-xs text-white/70">
                  {stats.synergies} synerg{stats.synergies !== 1 ? "ies" : "y"}
                </span>
              </div>
            )}
            
            {/* Pending Windows */}
            {stats.pendingWindows > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                <span className="font-mono text-xs text-white/50">
                  {stats.pendingWindows} pending
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Skeleton Component
// ============================================================================

export function BioScoreHeroSkeleton() {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-4">
        {/* Gauge skeleton */}
        <div className="h-[80px] w-[120px] animate-pulse rounded-lg bg-white/5" />
        
        {/* Stats skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
          <div className="flex gap-3">
            <div className="h-4 w-24 animate-pulse rounded bg-white/5" />
            <div className="h-4 w-20 animate-pulse rounded bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
