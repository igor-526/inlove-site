import { PageContainer, Section, Text } from "@/ui";
import styles from "./placeholderPages.module.css";

export const UNDER_CONSTRUCTION_MESSAGE =
  "Раздел находится в разработке. Скоро здесь появится подробная информация.";

export function UnderConstructionPage({
  heading,
  message = UNDER_CONSTRUCTION_MESSAGE,
  privacyAnchor = false,
}: {
  heading: string;
  message?: string;
  privacyAnchor?: boolean;
}) {
  return (
    <main className={styles.main}>
      <Section spacing="editorial">
        <PageContainer>
          <div className={styles.content}>
            <Text as="h1" variant="display-l">{heading}</Text>
            <Text variant="body-l" tone="secondary" className={styles.message}>{message}</Text>
          </div>
        </PageContainer>
      </Section>
      {privacyAnchor ? (
        <Section id="privacy" spacing="compact" className={styles.privacy} aria-label="Политика обработки персональных данных">
          <PageContainer>
            <Text as="h2" variant="h2">Политика обработки персональных данных</Text>
            <Text tone="secondary">
              Мы используем имя, телефон и комментарий только для ответа на обращение. Отозвать согласие можно, связавшись с клубом по контактам на сайте.
            </Text>
          </PageContainer>
        </Section>
      ) : null}
    </main>
  );
}
