"use client"

import type React from "react"

import { useState } from "react"
import { toast } from "sonner"
import { Bot as BotIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { botClient, blobClient, type Bot } from "@/lib/api-client"

interface BotFormDialogProps {
  bot?: Bot
  onSaved: (bot: Bot) => void
  trigger: React.ReactNode
}

export function BotFormDialog({ bot, onSaved, trigger }: BotFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(bot?.name ?? "")
  const [description, setDescription] = useState(bot?.description ?? "")
  const [avatarUrl, setAvatarUrl] = useState(bot?.avatarUrl ?? "")
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const buf = await file.arrayBuffer()
      const resp = await blobClient.imageUpload({ image: new Uint8Array(buf) })
      setAvatarUrl(resp.url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the image.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (bot) {
        const resp = await botClient.botUpdate({ id: bot.id, bot: { name, description, avatarUrl } })
        if (resp.bot) onSaved(resp.bot)
      } else {
        const resp = await botClient.botCreate({ bot: { name, description, avatarUrl } })
        if (resp.bot) onSaved(resp.bot)
      }
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this bot.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{bot ? "Edit Bot" : "New Bot"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || undefined} alt={name} />
              <AvatarFallback>
                <BotIcon className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} disabled={isUploading} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
