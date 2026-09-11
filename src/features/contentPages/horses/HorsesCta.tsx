"use client";

import { PageContainer, Section, Text } from "@/ui/foundations";
import { Button } from "@/ui/controls";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import styles from "./horses.module.css";

export function HorsesCta({ label }: { label: string }) {
  return <Section tone="forest" headingId="horses-cta-heading"><PageContainer>
    <div className={styles.cta}>
      <Text as="h2" id="horses-cta-heading" variant="h2" tone="inverse">Хотите познакомиться лично?</Text>
      <Button onClick={() => window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: { route: "/loshadi" } }))}>{label}</Button>
    </div>
  </PageContainer></Section>;
}
