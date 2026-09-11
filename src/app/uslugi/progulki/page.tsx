import type { Metadata } from "next";
import { loadRidesData } from "@/features/contentPages/services/ridesLoaders";
import { RidesContent, ridesMetadata } from "@/features/contentPages/rides/RidesContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadRidesData();
  return ridesMetadata(data.settings);
}

export default async function RidesPage() {
  const data = await loadRidesData();
  return <RidesContent data={data} />;
}
