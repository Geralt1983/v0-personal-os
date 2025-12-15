import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get("file") as File

    if (!audioFile) {
      return Response.json({ error: "No audio file provided" }, { status: 400 })
    }

    // Convert webm to a format OpenAI accepts
    const whisperFormData = new FormData()
    whisperFormData.append("file", audioFile, "audio.webm")
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
      return Response.json({ error: "Transcription failed" }, { status: 500 })
    }

    const text = await response.text()
    return Response.json({ text })
  } catch (error) {
    console.error("Transcription error:", error)
    return Response.json({ error: "Failed to transcribe audio" }, { status: 500 })
  }
}
