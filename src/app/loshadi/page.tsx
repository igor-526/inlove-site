import type { Metadata } from "next";
import { loadHorsesData } from "@/features/contentPages/horses/loaders";
import { HorsesContent, horsesMetadata } from "@/features/contentPages/horses/HorsesContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadHorsesData();
  return horsesMetadata(data.settings);
}

export default async function HorsesPage() {
  const data = await loadHorsesData();
  return <HorsesContent data={data} />;
}
