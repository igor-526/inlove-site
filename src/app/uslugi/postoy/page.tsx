import type { Metadata } from "next";
import { loadBoardingData } from "@/features/contentPages/services/boardingLoaders";
import { BoardingContent, boardingMetadata } from "@/features/contentPages/boarding/BoardingContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadBoardingData();
  return boardingMetadata(data);
}

export default async function BoardingPage() {
  const data = await loadBoardingData();
  return <BoardingContent data={data} />;
}
