import type { Metadata } from "next";
import { PageContainer, Section, Text } from "@/ui";

export const metadata: Metadata = {
  title: "Инлав | Политика обработки персональных данных",
  description: "Информация об обработке персональных данных при обращении в конный клуб «Инлав».",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <Section spacing="editorial" headingId="privacy-heading">
      <PageContainer>
        <Text as="h1" id="privacy-heading" variant="display-l">
          Политика обработки персональных данных
        </Text>
        <Text variant="body-l">
          Имя, телефон и комментарий, указанные в форме обратной связи, используются только для ответа на обращение.
        </Text>
        <Text>
          Передавая данные, пользователь подтверждает согласие на их обработку для связи по оставленной заявке. Чтобы отозвать согласие или уточнить порядок обработки данных, свяжитесь с клубом по контактам, опубликованным на сайте.
        </Text>
      </PageContainer>
    </Section>
  );
}
