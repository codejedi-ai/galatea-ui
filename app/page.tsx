"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"

export default function Home() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleOpen = () => {
    startTransition(() => {
      router.push("/start")
    })
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main>
        {/* Hero Section */}
        <section className="relative h-screen flex items-center">
          <div className="absolute inset-0 z-0">
            <Image
              src="/hero.png"
              alt="AI Companion"
              fill
              style={{ objectFit: "cover", objectPosition: "center" }}
              className="opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
          </div>

          <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-2xl">
              <h1 className="text-5xl md:text-7xl font-bold mb-6">
                Sculpt Your Perfect <span className="text-primary">AI Companion</span>
              </h1>
              <p className="text-xl md:text-2xl text-foreground/70 mb-10">
                Galatea.AI brings the Pygmalion myth to life with cutting-edge artificial intelligence. Create,
                customize, and connect with your ideal AI partner.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={handleOpen}
                  disabled={isPending}
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
                      Opening…
                    </>
                  ) : (
                    "Open Galatea"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
