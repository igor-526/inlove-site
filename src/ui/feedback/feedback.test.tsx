// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EmptyState, ErrorBlock, InlineNotice, Skeleton, Toast } from "./index";

describe("CT-ILUI-03 feedback states", () => {
  it("uses one suitable live region for success and error feedback", () => {
    const { container } = render(<><Toast tone="success" message="Заявка отправлена" /><InlineNotice tone="error" title="Ошибка" message="Попробуйте снова" /></>);
    expect(container.querySelectorAll('[role="status"]')).toHaveLength(1);
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(1);
    expect(container.textContent).toContain("Заявка отправлена");
  });

  it("keeps loading geometry and exposes retry and empty states", () => {
    const retry = vi.fn();
    const { container, getByRole } = render(<><Skeleton variant="card" count={3} /><ErrorBlock message="Сеть недоступна" onRetry={retry} /><EmptyState message="Материалы появятся позже" /></>);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(3);
    fireEvent.click(getByRole("button", { name: "Повторить" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("Материалы появятся позже");
  });
});
