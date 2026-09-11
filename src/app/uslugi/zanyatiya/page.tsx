import type { Metadata } from "next";
import { loadLessonsData } from "@/features/contentPages/services/lessonsLoaders";
import { LessonsContent, lessonsMetadata } from "@/features/contentPages/lessons/LessonsContent";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const data = await loadLessonsData();
  return lessonsMetadata(data);
}

export default async function LessonsPage() {
  const data = await loadLessonsData();
  return <LessonsContent data={data} />;
}
