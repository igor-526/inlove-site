// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteSettingsProvider } from "@/features/siteSettings";
import { FALLBACK_SHARED_SETTINGS } from "@/features/siteSettings/services/getSiteSettings";
import { CallbackModal } from "./CallbackModal";
import { CallBackRequestError, sendCallBackRequest } from "./services/sendCallBackRequest";

vi.mock("./services/sendCallBackRequest", async (original) => {
  const actual = await original<typeof import("./services/sendCallBackRequest")>();
  return { ...actual, sendCallBackRequest: vi.fn() };
});
const sendMock = vi.mocked(sendCallBackRequest);

function renderModal(overrides: Partial<typeof FALLBACK_SHARED_SETTINGS.callback> = {}, onClose = vi.fn()) {
  const settings = { ...FALLBACK_SHARED_SETTINGS, callback: { ...FALLBACK_SHARED_SETTINGS.callback, ...overrides } };
  return { onClose, ...render(<SiteSettingsProvider settings={settings}><button>Открыть</button><CallbackModal open context={{ route: "/loshadi", horseName: "Искра" }} onClose={onClose} /></SiteSettingsProvider>) };
}

function fillValid() {
  fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "Анна" } });
  fireEvent.input(screen.getByLabelText(/Телефон/), { target: { value: "+79991234567" }, inputType: "insertText" });
  fireEvent.change(screen.getByLabelText("Комментарий"), { target: { value: "Позвоните вечером" } });
  fireEvent.click(screen.getByRole("checkbox"));
}

describe("CT-CB-02..08/CT-NOTE-CB-01 CallbackModal", () => {
  beforeEach(() => { sendMock.mockReset(); document.body.style.overflow = ""; });
  afterEach(() => cleanup());

  it("is a named dialog, traps focus, closes with Escape and restores focus", async () => {
    const trigger = document.createElement("button"); trigger.textContent = "trigger"; document.body.append(trigger); trigger.focus();
    const { onClose, unmount } = renderModal({}, vi.fn());
    expect(screen.getByRole("dialog", { name: FALLBACK_SHARED_SETTINGS.callback.title }).getAttribute("aria-modal")).toBe("true");
    expect(document.body.style.overflow).toBe("hidden");
    const close = screen.getByRole("button", { name: "Закрыть форму" });
    await waitFor(() => expect(document.activeElement).toBe(close));
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    expect(onClose).toHaveBeenCalledOnce();
    unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it("blocks invalid submit, exposes consent error and focuses the first invalid field", async () => {
    renderModal({ policyUrl: "javascript:alert(1)" });
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText(/Телефон/)));
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
    expect(screen.queryByRole("link", { name: "Политика" })).toBeNull();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(["", "/about#privacy", "/about/?source=form#privacy", "javascript:alert(1)", "//example.com/policy"])("keeps mandatory consent without a policy link for %s", async (policyUrl) => {
    renderModal({ policyUrl });
    expect(screen.queryByRole("link", { name: "Политика" })).toBeNull();
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: "+79991234567" } });
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("checkbox")));
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(["https://example.com/policy", "/documents/policy.pdf"])("preserves configured policy URL %s", (policyUrl) => {
    renderModal({ policyUrl });
    expect(screen.getByRole("link", { name: "Политика" }).getAttribute("href")).toBe(policyUrl);
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
  });

  it("submits one exact contract payload, preserves geometry while pending, then shows a persistent success", async () => {
    let resolve!: () => void;
    sendMock.mockImplementation(() => new Promise<void>((done) => { resolve = done; }));
    renderModal(); fillValid();
    const form = screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!;
    fireEvent.submit(form); fireEvent.submit(form);
    await waitFor(() => expect(sendMock).toHaveBeenCalledOnce());
    expect(screen.queryByText(/Страница:/)).toBeNull();
    expect(screen.queryByText("/loshadi")).toBeNull();
    expect(screen.getByText("Лошадь: Искра")).toBeTruthy();
    expect(sendMock).toHaveBeenCalledWith({ name: "Анна", phone: "+79991234567", comment: "Позвоните вечером\n\nЛошадь: Искра" });
    expect(form.getAttribute("aria-busy")).toBe("true");
    expect((screen.getByDisplayValue("Анна") as HTMLInputElement).disabled).toBe(true);
    resolve();
    expect((await screen.findByRole("status")).textContent).toContain(FALLBACK_SHARED_SETTINGS.callback.successMessage);
  });

  it.each([
    [401, "настройки сайта"],
    [400, "Проверьте введённые данные"],
    [422, "Проверьте введённые данные"],
    [500, "Не удалось отправить"],
    [undefined, "Не удалось отправить"],
  ])("maps status %s and preserves entered values", async (status, message) => {
    let reject!: (error: Error) => void;
    sendMock.mockImplementation(() => new Promise<void>((_, fail) => { reject = fail; }));
    renderModal(); fillValid();
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    await waitFor(() => expect(sendMock).toHaveBeenCalledOnce());
    const pendingPhone = screen.getByLabelText(/Телефон/) as HTMLInputElement;
    expect(pendingPhone.disabled).toBe(true);
    expect(pendingPhone.value).toBe("+79991234567");
    reject(new CallBackRequestError("failure", status));
    expect(await screen.findByText(new RegExp(message))).toBeTruthy();
    await waitFor(() => {
      expect((screen.getByLabelText("Имя") as HTMLInputElement).value).toBe("Анна");
      const phone = screen.getByLabelText(/Телефон/) as HTMLInputElement;
      expect(phone.type).toBe("tel");
      expect(phone.value).toBe("+79991234567");
      expect((screen.getByLabelText("Комментарий") as HTMLTextAreaElement).value).toBe("Позвоните вечером");
      expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    });
  });

  it("captures the browser tel DOM value before the pending error rerender", async () => {
    let reject!: (error: Error) => void;
    sendMock.mockImplementation(() => new Promise<void>((_, fail) => { reject = fail; }));
    renderModal(); fillValid();
    const phone = screen.getByLabelText(/Телефон/) as HTMLInputElement;
    const nativeValueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    nativeValueSetter?.call(phone, "+7 981 838-48-31");
    expect(phone.value).toBe("+7 981 838-48-31");

    fireEvent.submit(phone.closest("form")!);
    await waitFor(() => expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ phone: "+7 981 838-48-31" })));
    reject(new CallBackRequestError("failure", 500));

    expect(await screen.findByText(/Не удалось отправить/)).toBeTruthy();
    await waitFor(() => expect((screen.getByLabelText(/Телефон/) as HTMLInputElement).value).toBe("+7 981 838-48-31"));
  });
});
