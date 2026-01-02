import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    // Get the content type to verify it's multipart
    const contentType = req.headers.get("content-type") || ""

    if (!contentType.includes("multipart/form-data")) {
      // Try to parse as raw audio if not multipart
      const arrayBuffer = await req.arrayBuffer()
      if (arrayBuffer.byteLength === 0) {
        return NextResponse.json({ error: "No audio data provided" }, { status: 400 })
      }

      // Create a Blob from the raw data
      const audioBlob = new Blob([arrayBuffer], { type: "audio/webm" })
      const whisperFormData = new FormData()
      whisperFormData.append("file", audioBlob, "audio.webm")
      whisperFormData.append("model", "whisper-1")
      whisperFormData.append("response_format", "text")

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: whisperFormData,
      })

      if (!response.ok) {
        const error = await response.text()
        console.error("Whisper API error:", error)
        return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
      }

      const text = await response.text()
      return NextResponse.json({ text })
    }

    // Handle multipart form data
    const formData = await req.formData()
    const audioFile = formData.get("file") as File | null

    if (!audioFile) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Create FormData for OpenAI
    const whisperFormData = new FormData()
    whisperFormData.append("file", audioFile, audioFile.name || "audio.webm")
    whisperFormData.append("model", "whisper-1")
    whisperFormData.append("response_format", "text")

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: whisperFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error("Whisper API error:", error)
      return NextResponse.json({ error: "Transcription failed" }, { status: 500 })
    }

    const text = await response.text()
    return NextResponse.json({ text })
  } catch (error) {
    console.error("Transcription error:", error)
    return NextResponse.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
