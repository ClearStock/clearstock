import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: /api/speech-to-text
 * 
 * Accepts audio file (FormData) and sends it to ElevenLabs Speech-to-Text API
 * Returns transcription text in JSON format
 */
export async function POST(request: NextRequest) {
  try {
    // Get API key from environment variable
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      console.error("ELEVENLABS_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    // Get FormData from request
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Invalid file type. Expected audio file." },
        { status: 400 }
      );
    }

    // Convert File to Blob for ElevenLabs API
    const audioBlob = await audioFile.arrayBuffer();

    console.log("Received audio file:", {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size,
    });

    // Prepare FormData for ElevenLabs API
    const elevenLabsFormData = new FormData();
    
    // Create a File object for ElevenLabs (they may require specific format)
    const fileBlob = new Blob([audioBlob], { type: audioFile.type || "audio/webm" });
    elevenLabsFormData.append("file", fileBlob, audioFile.name || "audio.webm");

    // ElevenLabs STT API may accept language as form field or query param
    // Try both approaches - form field first
    elevenLabsFormData.append("language_code", "pt-PT");

    console.log("Sending to ElevenLabs API...");

    // Call ElevenLabs Speech-to-Text API
    // Endpoint: https://api.elevenlabs.io/v1/speech-to-text
    // Alternative endpoints to try if this fails:
    // - https://api.elevenlabs.io/v1/speech-to-text/transcribe
    // - https://api.elevenlabs.io/v1/speech-to-text/convert
    const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        // Don't set Content-Type - let browser set it with boundary for FormData
      },
      body: elevenLabsFormData,
    });

    console.log("ElevenLabs API response status:", response.status, response.statusText);

    if (!response.ok) {
      let errorText: string;
      try {
        const errorJson = await response.json();
        errorText = JSON.stringify(errorJson);
        console.error("ElevenLabs API error (JSON):", response.status, errorJson);
      } catch {
        errorText = await response.text();
        console.error("ElevenLabs API error (text):", response.status, errorText);
      }
      
      return NextResponse.json(
        { 
          error: "Failed to transcribe audio",
          details: errorText || `HTTP ${response.status}` 
        },
        { status: response.status }
      );
    }

    // Parse response from ElevenLabs
    let data: any;
    try {
      data = await response.json();
      console.log("ElevenLabs API response data:", data);
    } catch (parseError) {
      const textResponse = await response.text();
      console.error("Failed to parse JSON response, got text:", textResponse);
      return NextResponse.json(
        { error: "Invalid response from API", details: textResponse },
        { status: 500 }
      );
    }

    // Extract transcription text
    // ElevenLabs STT API may return different structures:
    // - { text: "..." }
    // - { transcription: "..." }
    // - { result: { text: "..." } }
    const transcription = data.text || data.transcription || data.result?.text || data.data?.text || "";

    if (!transcription) {
      console.warn("No transcription found in ElevenLabs response. Full response:", JSON.stringify(data, null, 2));
      return NextResponse.json(
        { 
          error: "No transcription received from API",
          details: "API returned success but no transcription text. Check API response structure.",
          debug: data
        },
        { status: 500 }
      );
    }

    // Return transcription
    return NextResponse.json({ text: transcription });

  } catch (error) {
    console.error("Error in speech-to-text API route:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

// Disable caching for this route
export const dynamic = "force-dynamic";

