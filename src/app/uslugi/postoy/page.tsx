import { UnderConstructionPage, createRouteMetadata, PLACEHOLDER_ROUTES } from "@/features/placeholderPages";

export const generateMetadata = () => createRouteMetadata("boarding");

export default function BoardingPage() {
  return <UnderConstructionPage heading={PLACEHOLDER_ROUTES.boarding.heading} />;
}
