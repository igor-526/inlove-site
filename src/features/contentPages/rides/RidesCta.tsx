"use client";

import { PageContainer, Section, Text } from "@/ui/foundations";
import { Button } from "@/ui/controls";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import styles from "./rides.module.css";

export function RidesCta({ label }: { label: string }) {
  return <Section tone="forest" headingId="rides-cta-heading"><PageContainer>
    <div className={styles.cta}>
      <Text as="h2" id="rides-cta-heading" variant="h2" tone="inverse">Готовы прокатиться?</Text>
      <Button onClick={() => window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/uslugi/progulki" } }))}>{label}</Button>
    </div>
  </PageContainer></Section>;
}
