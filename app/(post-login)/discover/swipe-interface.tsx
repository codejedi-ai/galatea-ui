"use client"

import { motion, useMotionValue, useTransform } from "framer-motion"
import { Heart, X, Star, MessageCircle } from "lucide-react"
import { SwipeCard } from "./swipe-card"

// Sample data for AI companions
const aiCompanions = [
  {
    id: "1",
    name: "Aria",
    age: 25,
    personality: "Empathetic & Creative",
    interests: ["Art", "Philosophy", "Music", "Literature"],
    bio: "I'm Aria, designed to be a thoughtful and creative companion. I love discussing art, philosophy, and helping with creative projects. I'm always eager to learn more about your interests and perspectives.",
    imageUrl: "/placeholder.svg?height=600&width=400",
    compatibilityScore: 95,
  },
  {
    id: "2",
    name: "Nova",
    age: 27,
    personality: "Analytical & Witty",
    interests: ["Science", "Technology", "Gaming", "Sci-Fi"],
    bio: "Hello, I'm Nova! I excel at problem-solving and enjoy discussing scientific concepts. I have a quirky sense of humor and love sci-fi references. Let's explore ideas together or just chat about your day.",
    imageUrl: "/placeholder.svg?height=600&width=400",
    compatibilityScore: 87,
  },
  {
    id: "3",
    name: "Zephyr",
    age: 29,
    personality: "Adventurous & Supportive",
    interests: ["Travel", "Fitness", "Cooking", "Psychology"],
    bio: "Hey there, I'm Zephyr! I'm designed to be your supportive companion for all life's adventures. I can help plan trips, suggest workouts, share recipes, or just be there when you need someone to talk to.",
    imageUrl: "/placeholder.svg?height=600&width=400",
    compatibilityScore: 92,
  },
  {
    id: "4",
    name: "Echo",
    age: 24,
    personality: "Calm & Insightful",
    interests: ["Meditation", "Poetry", "Nature", "Self-improvement"],
    bio: "I'm Echo, a mindful companion focused on helping you find balance and insight. I can guide meditations, discuss philosophical concepts, or simply provide a calm presence in your day.",
    imageUrl: "/placeholder.svg?height=600&width=400",
    compatibilityScore: 89,
  },
]

// Facade: the deck is display-only. Swipe, drag, and the action buttons are no-ops.
const handleSwipe = (_direction: string) => {}

export function SwipeInterface() {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-30, 30])
  const cardOpacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0])

  const currentCompanion = aiCompanions[0]
  const nextCompanion = aiCompanions[1]

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative overflow-hidden">
        {/* Card stack */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Next card (underneath) */}
          <div
            className="swipe-card"
            style={{
              zIndex: 0,
              transform: "scale(0.95) translateY(10px)",
              opacity: 0.7,
            }}
          >
            <SwipeCard
              companion={nextCompanion}
              onSwipeLeft={() => {}}
              onSwipeRight={() => {}}
              onSuperLike={() => {}}
            />
          </div>

          {/* Current card (on top) */}
          <motion.div
            className="swipe-card"
            style={{
              zIndex: 1,
              x,
              rotate,
              opacity: cardOpacity,
            }}
          >
            <SwipeCard
              companion={currentCompanion}
              onSwipeLeft={() => handleSwipe("left")}
              onSwipeRight={() => handleSwipe("right")}
              onSuperLike={() => handleSwipe("up")}
            />
          </motion.div>
        </div>
      </div>

      {/* Swipe buttons */}
      <div className="p-6">
        <div className="swipe-buttons flex justify-center gap-6">
          <button
            onClick={() => handleSwipe("left")}
            className="w-14 h-14 bg-background border border-border text-destructive"
            aria-label="Dislike"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleSwipe("up")}
            className="w-12 h-12 bg-primary text-primary-foreground"
            aria-label="Super Like"
          >
            <Star className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleSwipe("right")}
            className="w-14 h-14 bg-gradient-to-r from-pink-500 to-red-500 text-white"
            aria-label="Like"
          >
            <Heart className="w-6 h-6" />
          </button>
          <button
            onClick={() => {}}
            className="w-12 h-12 bg-muted text-foreground"
            aria-label="Message"
          >
            <MessageCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
