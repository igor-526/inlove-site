"use client";

import { PageContainer, Section, Text } from "@/ui/foundations";
import { Button } from "@/ui/controls";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import styles from "./boarding.module.css";

export function BoardingCta({ label }: { label: string }) {
  return <Section tone="forest" headingId="boarding-cta-heading"><PageContainer>
    <div className={styles.cta}>
      <Text as="h2" id="boarding-cta-heading" variant="h2" tone="inverse">Готовы оставить лошадь у нас?</Text>
      <Button onClick={() => window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/uslugi/postoy" } }))}>{label}</Button>
    </div>
  </PageContainer></Section>;
}
