import { UnderConstructionPage, createRouteMetadata, PLACEHOLDER_ROUTES } from "@/features/placeholderPages";

export const generateMetadata = () => createRouteMetadata("lessons");

export default function LessonsPage() {
  return <UnderConstructionPage heading={PLACEHOLDER_ROUTES.lessons.heading} />;
}
