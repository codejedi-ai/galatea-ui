"use client"

import { SwipeInterface } from "@/app/(shell)/discover/swipe-interface"

export default function DashboardPage() {
  return (
    <div className="h-full overflow-hidden">
      <div className="mx-auto h-full max-w-2xl">
        <SwipeInterface />
      </div>
    </div>
  )
}
