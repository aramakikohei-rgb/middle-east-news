import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/rss";
import { Tier } from "@/types";

export const revalidate = 300; // ISR: 5 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tierParam = searchParams.get("tier");
  const sourceParam = searchParams.get("source");

  let articles = await fetchAllFeeds();

  if (tierParam && tierParam !== "all") {
    const tiers = tierParam.split(",").map(Number) as Tier[];
    articles = articles.filter((a) => tiers.includes(a.source.tier));
  }

  if (sourceParam) {
    const sources = sourceParam.split(",");
    articles = articles.filter((a) => sources.includes(a.source.id));
  }

  return NextResponse.json({ articles, fetchedAt: new Date().toISOString() });
}
