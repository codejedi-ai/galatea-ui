import { NextRequest } from "next/server"
import { callGalatea, galateaErrorResponse } from "@/lib/galatea-server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"
import type { BotDto } from "@/app/api/bots/route"

function requireToken(req: NextRequest): string | Response {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  return token ?? Response.json({ message: "not signed in" }, { status: 401 })
}

type RouteContext = { params: Promise<{ id: string }> }

// -> galatea.v1.BotService/BotUpdate
export async function PUT(req: NextRequest, ctx: RouteContext) {
  const token = requireToken(req)
  if (typeof token !== "string") return token
  const { id } = await ctx.params
  const { name, description, avatarUrl } = await req.json()
  try {
    const data = await callGalatea<{ bot: BotDto }>(
      "galatea.v1.BotService/BotUpdate",
      { id, bot: { name, description, avatarUrl } },
      token,
    )
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}

// -> galatea.v1.BotService/BotDelete
export async function DELETE(req: NextRequest, ctx: RouteContext) {
  const token = requireToken(req)
  if (typeof token !== "string") return token
  const { id } = await ctx.params
  try {
    const data = await callGalatea<{ bot: BotDto }>("galatea.v1.BotService/BotDelete", { id }, token)
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
