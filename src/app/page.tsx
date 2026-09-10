import { HomeContent, homeMetadata } from '@/features/contentPages/home/HomeContent';
import { loadContentSettings, loadHomeData } from '@/features/contentPages/services/loaders';
export const dynamic = 'force-dynamic';
export async function generateMetadata() { return homeMetadata(await loadContentSettings()); }
export default async function HomePage() { return <HomeContent data={await loadHomeData()} />; }
