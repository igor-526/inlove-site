import { UnderConstructionPage, createRouteMetadata, PLACEHOLDER_ROUTES } from "@/features/placeholderPages";

export const generateMetadata = () => createRouteMetadata("rides");

export default function RidesPage() {
  return <UnderConstructionPage heading={PLACEHOLDER_ROUTES.rides.heading} />;
}
