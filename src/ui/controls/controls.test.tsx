// @vitest-environment jsdom
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Accordion, Button, Field, PaginationLoadMore } from "./index";

describe("CT-ILUI-02 controls", () => {
  it("blocks repeated action while loading and preserves its accessible label", () => {
    const action = vi.fn();
    const { getByRole } = render(<Button loading onClick={action}>Отправить длинную заявку на обратный звонок</Button>);
    const button = getByRole("button", { name: "Отправить длинную заявку на обратный звонок" }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(button);
    expect(action).not.toHaveBeenCalled();
  });

  it("links an invalid field to its visible error", () => {
    const { getByLabelText } = render(<Field id="phone" label="Телефон" required error="Введите телефон" value="" onChange={() => undefined} />);
    const field = getByLabelText("Телефон *");
    expect(field.getAttribute("aria-invalid")).toBe("true");
    expect(field.getAttribute("aria-describedby")).toBe("phone-error");
    expect(document.getElementById("phone-error")?.textContent).toBe("Введите телефон");
  });

  it("exposes accordion state and local pagination status", () => {
    const load = vi.fn();
    const { getByRole, getByText } = render(<><Accordion items={[{ id: "terms", title: "Длинные условия", content: "Полный текст" }]} /><PaginationLoadMore page={1} loaded={12} total={24} onLoadMore={load} /></>);
    const trigger = getByRole("button", { name: "Длинные условия" });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(getByText("Полный текст")).toBeTruthy();
    fireEvent.click(getByRole("button", { name: "Показать ещё" }));
    expect(load).toHaveBeenCalledWith(2);
    expect(getByText("Показано 12 из 24").getAttribute("aria-live")).toBe("polite");
  });
});
