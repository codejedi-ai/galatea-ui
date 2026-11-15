import { NextRequest } from "next/server"
import { callGalatea, galateaErrorResponse } from "@/lib/galatea-server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

export interface BotDto {
  id: string
  name: string
  description: string
  avatarUrl: string
}

function requireToken(req: NextRequest): string | Response {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  return token ?? Response.json({ message: "not signed in" }, { status: 401 })
}

// -> galatea.v1.BotService/BotAll
export async function GET(req: NextRequest) {
  const token = requireToken(req)
  if (typeof token !== "string") return token
  try {
    const data = await callGalatea<{ bots?: BotDto[] }>("galatea.v1.BotService/BotAll", {}, token)
    return Response.json({ bots: data.bots ?? [] })
  } catch (err) {
    return galateaErrorResponse(err)
  }
}

// -> galatea.v1.BotService/BotCreate
export async function POST(req: NextRequest) {
  const token = requireToken(req)
  if (typeof token !== "string") return token
  const { name, description, avatarUrl } = await req.json()
  try {
    const data = await callGalatea<{ bot: BotDto }>(
      "galatea.v1.BotService/BotCreate",
      { bot: { name, description, avatarUrl } },
      token,
    )
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
