import { NextRequest } from "next/server"
import { callGalatea, galateaErrorResponse } from "@/lib/galatea-server"
import { ACCESS_TOKEN_COOKIE } from "@/lib/session"

// -> galatea.v1.ImageUploadService/ImageUpload. Takes the raw file bytes as
// the request body; the proto's `bytes image` field is base64 in Connect's
// JSON mapping, so it's re-encoded here before forwarding.
export async function POST(req: NextRequest) {
  const token = req.cookies.get(ACCESS_TOKEN_COOKIE)?.value
  if (!token) {
    return Response.json({ message: "not signed in" }, { status: 401 })
  }

  const buf = await req.arrayBuffer()
  const image = Buffer.from(buf).toString("base64")

  try {
    const data = await callGalatea<{ url: string }>(
      "galatea.v1.ImageUploadService/ImageUpload",
      { image },
      token,
    )
    return Response.json(data)
  } catch (err) {
    return galateaErrorResponse(err)
  }
}
