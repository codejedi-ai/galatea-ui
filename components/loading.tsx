"use client"

import Image from "next/image"

export function LoadingScreen({ message = "Loading...", progress }: { message?: string; progress?: number }) {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <div className="w-full max-w-md px-4 flex flex-col items-center">
        <GlowingGalateaAILogo />
        <GalateaAIBarLoader progress={progress} message={message} />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-background via-primary to-background animate-shimmer" />
    </div>
  )
}

export function GlowingGalateaAILogo() {
  return (
    <Image
      src="/galatea-ai-logo.png"
      alt="Galatea AI Logo"
      width={100}
      height={100}
      className="mb-8 animate-pulse filter brightness-0 invert"
      priority
    />
  )
}

export function CircleLoader() {
  return (
    <div className="relative w-full h-40 flex items-center justify-center mb-8">
      <div className="absolute w-32 h-32 rounded-full border-4 border-t-transparent border-primary animate-spin" />
      <div className="absolute w-24 h-24 rounded-full border-4 border-b-transparent border-primary/70 animate-spin [animation-delay:500ms]" />
      <div className="absolute w-16 h-16 rounded-full border-4 border-l-transparent border-primary animate-spin [animation-delay:1000ms]" />
    </div>
  )
}

interface GalateaAIBarLoaderProps {
  /** 0-100 when real progress is known; omit for an indeterminate bar. */
  progress?: number
  message: string
}

export function GalateaAIBarLoader({ progress, message }: GalateaAIBarLoaderProps) {
  const determinate = typeof progress === "number" && Number.isFinite(progress)
  const clamped = determinate ? Math.min(100, Math.max(0, progress)) : 0
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-foreground mb-8 text-center">Galatea AI</h1>
      <div
        className="relative w-full h-2 bg-muted rounded-full mb-4 overflow-hidden"
        role="progressbar"
        aria-label={message}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={determinate ? Math.round(clamped) : undefined}
      >
        {determinate ? (
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clamped}%` }}
          />
        ) : (
          <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-primary to-primary/70 rounded-full animate-pulse" />
        )}
      </div>
      <p className="text-primary text-lg font-medium text-center">{message}</p>
    </div>
  )
}
