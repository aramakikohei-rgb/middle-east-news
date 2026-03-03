import { NextRequest, NextResponse } from "next/server";
import { translateToJapanese } from "@/lib/translate";

export async function POST(request: NextRequest) {
  const { title, summary } = await request.json();

  if (!title) {
    return NextResponse.json(
      { error: "title is required" },
      { status: 400 }
    );
  }

  const result = await translateToJapanese(title, summary || "");
  return NextResponse.json(result);
}
