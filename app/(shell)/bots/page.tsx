"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Bot as BotIcon, Pencil, Plus, Trash2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { botClient, type Bot } from "@/lib/api-client"
import { BotFormDialog } from "./bot-form-dialog"

export default function BotsPage() {
  const [bots, setBots] = useState<Bot[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadBots = async () => {
    setIsLoading(true)
    try {
      const resp = await botClient.botAll()
      setBots(resp.bots)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load your bots.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBots()
  }, [])

  const handleSaved = (bot: Bot) => {
    setBots((prev) => {
      const exists = prev.some((b) => b.id === bot.id)
      return exists ? prev.map((b) => (b.id === bot.id ? bot : b)) : [...prev, bot]
    })
    toast.success("Bot saved.")
  }

  const handleDelete = async (bot: Bot) => {
    try {
      await botClient.botDelete({ id: bot.id })
      setBots((prev) => prev.filter((b) => b.id !== bot.id))
      toast.success("Bot deleted.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete this bot.")
    }
  }

  return (
    <div className="h-full overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-foreground">My Bots</h1>
            <BotFormDialog
              onSaved={handleSaved}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Bot
                </Button>
              }
            />
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : bots.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <BotIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-foreground font-medium">No bots yet</p>
              <p className="text-muted-foreground text-sm mt-1">Create your first AI companion to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {bots.map((bot) => (
                <Card key={bot.id}>
                  <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                    <Avatar>
                      <AvatarImage src={bot.avatarUrl || undefined} alt={bot.name} />
                      <AvatarFallback>
                        <BotIcon className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">{bot.description}</p>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <BotFormDialog
                      bot={bot}
                      onSaved={handleSaved}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {bot.name}?</AlertDialogTitle>
                          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(bot)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
    </div>
  )
}
