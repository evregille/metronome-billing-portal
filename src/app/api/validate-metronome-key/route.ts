import { NextRequest, NextResponse } from "next/server";
import Metronome from "@metronome/sdk/index.mjs";

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is required" },
        { status: 400 }
      );
    }

    // Test the API key by making a simple call
    const client = new Metronome({ bearerToken: apiKey });
    
    // Try to list customers to validate the API key
    await client.v1.customers.list({ limit: 1 });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("API key validation error:", error);
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401 }
    );
  }
} 