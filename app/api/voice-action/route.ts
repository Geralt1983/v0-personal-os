import { processVoiceInput, transcribeAudio } from "@/lib/ai/voice"
import { createLogger } from "@/lib/logger"

const logger = createLogger("API:VoiceAction")

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || ""

    // Handle audio upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData()
      const audioFile = formData.get("file") as File

      if (!audioFile) {
        return Response.json({ error: "No audio file provided" }, { status: 400 })
      }

      // Transcribe audio
      const transcription = await transcribeAudio(audioFile)
      logger.debug("Transcribed audio", { text: transcription.text })

      // Process the transcription
      const action = await processVoiceInput(transcription.text)

      return Response.json({
        transcription,
        action,
      })
    }

    // Handle text input (for testing or text-to-action)
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    const action = await processVoiceInput(text)
    return Response.json({ action })
  } catch (err) {
    logger.error("Voice action failed", {
      error: err instanceof Error ? err.message : String(err),
    })
    return Response.json({ error: "Failed to process voice input" }, { status: 500 })
  }
}
