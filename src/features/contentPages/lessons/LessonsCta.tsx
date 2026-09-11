"use client";

import { PageContainer, Section, Text } from "@/ui/foundations";
import { Button } from "@/ui/controls";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import styles from "./lessons.module.css";

export function LessonsCta({ label }: { label: string }) {
  return <Section tone="forest" headingId="lessons-cta-heading"><PageContainer>
    <div className={styles.cta}>
      <Text as="h2" id="lessons-cta-heading" variant="h2" tone="inverse">Готовы начать?</Text>
      <Button onClick={() => window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/uslugi/zanyatiya" } }))}>{label}</Button>
    </div>
  </PageContainer></Section>;
}
