import { UnderConstructionPage, createRouteMetadata, PLACEHOLDER_ROUTES } from "@/features/placeholderPages";

export const generateMetadata = () => createRouteMetadata("horses");

export default function HorsesPage() {
  return <UnderConstructionPage heading={PLACEHOLDER_ROUTES.horses.heading} />;
}
