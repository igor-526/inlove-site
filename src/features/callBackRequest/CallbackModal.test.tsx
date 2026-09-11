// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteSettingsProvider } from "@/features/siteSettings";
import { FALLBACK_SHARED_SETTINGS } from "@/features/siteSettings/services/getSiteSettings";
import { CallbackModal } from "./CallbackModal";
import { CallbackController } from "./CallbackController";
import { CallBackRequestError, sendCallBackRequest } from "./services/sendCallBackRequest";
import { CALLBACK_REQUEST_EVENT } from "@/features/siteChrome/SiteChrome";
import type { CallbackContext } from "./schema";

vi.mock("./services/sendCallBackRequest", async (original) => {
  const actual = await original<typeof import("./services/sendCallBackRequest")>();
  return { ...actual, sendCallBackRequest: vi.fn() };
});
const sendMock = vi.mocked(sendCallBackRequest);

function renderModal(overrides: Partial<typeof FALLBACK_SHARED_SETTINGS.callback> = {}, onClose = vi.fn()) {
  const settings = { ...FALLBACK_SHARED_SETTINGS, callback: { ...FALLBACK_SHARED_SETTINGS.callback, ...overrides } };
  return { onClose, ...render(<SiteSettingsProvider settings={settings}><button>Открыть</button><CallbackModal open context={{ route: "/loshadi", horseName: "Искра" }} onClose={onClose} /></SiteSettingsProvider>) };
}

function renderController() {
  return render(<SiteSettingsProvider settings={FALLBACK_SHARED_SETTINGS}><CallbackController /></SiteSettingsProvider>);
}

function openController(context: CallbackContext = { route: "/loshadi", horseName: "Искра" }) {
  window.dispatchEvent(new CustomEvent(CALLBACK_REQUEST_EVENT, { detail: context }));
}

function nativeInput(element: HTMLInputElement, value: string) {
  const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  nativeSetter?.call(element, value);
  element.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: value }));
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
    expect(screen.getByRole("link", { name: "Политика" }).getAttribute("href")).toBe("/about#privacy");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(["", "javascript:alert(1)", "//example.com/policy"])("uses the policy fallback while keeping mandatory consent for %s", async (policyUrl) => {
    renderModal({ policyUrl });
    expect(screen.getByRole("link", { name: "Политика" }).getAttribute("href")).toBe("/about#privacy");
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: "+79991234567" } });
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("checkbox")));
    expect(screen.getByRole("checkbox").getAttribute("aria-invalid")).toBe("true");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it.each(["https://example.com/policy", "/documents/policy.pdf", "/about#privacy", "/about/?source=form#privacy"])("preserves configured policy URL %s", (policyUrl) => {
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

  it("UT-CB71-05 omits whitespace optional fields and consent from the exact payload", async () => {
    sendMock.mockResolvedValue();
    renderModal();
    fireEvent.change(screen.getByLabelText("Имя"), { target: { value: "  " } });
    fireEvent.change(screen.getByLabelText(/Телефон/), { target: { value: " +79991234567 " } });
    fireEvent.change(screen.getByLabelText("Комментарий"), { target: { value: "\n" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    await waitFor(() => expect(sendMock).toHaveBeenCalledWith({ phone: "+79991234567", comment: "Лошадь: Искра" }));
    expect(sendMock.mock.calls[0][0]).not.toHaveProperty("consent");
  });

  it("rejects a composed comment over 2000 before pending/network and focuses comment", async () => {
    renderModal();
    const contextText = "Лошадь: Искра";
    const visitorComment = "x".repeat(2000 - contextText.length - 1);
    fireEvent.input(screen.getByLabelText(/Телефон/), { target: { value: "+79991234567" } });
    fireEvent.change(screen.getByLabelText("Комментарий"), { target: { value: visitorComment } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);

    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Комментарий")));
    expect(screen.getByText(/Комментарий с выбранным контекстом/)).toBeTruthy();
    expect((screen.getByLabelText("Комментарий") as HTMLTextAreaElement).value).toBe(visitorComment);
    expect((screen.getByLabelText(/Телефон/) as HTMLInputElement).value).toBe("+79991234567");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).getAttribute("aria-busy")).not.toBe("true");
    expect(sendMock).not.toHaveBeenCalled();
  });

  it("accepts an exact 2000-character composed comment without truncation", async () => {
    sendMock.mockResolvedValue();
    renderModal();
    const contextText = "Лошадь: Искра";
    const visitorComment = "x".repeat(2000 - contextText.length - 2);
    fireEvent.input(screen.getByLabelText(/Телефон/), { target: { value: "+79991234567" } });
    fireEvent.change(screen.getByLabelText("Комментарий"), { target: { value: visitorComment } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);

    await waitFor(() => expect(sendMock).toHaveBeenCalledOnce());
    const payload = sendMock.mock.calls[0][0];
    expect(payload.comment).toBe(`${visitorComment}\n\n${contextText}`);
    expect(payload.comment).toHaveLength(2000);
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

  it.each([
    [401, new CallBackRequestError("failure", 401)],
    [422, new CallBackRequestError("failure", 422)],
    [500, new CallBackRequestError("failure", 500)],
    ["network", new Error("offline")],
  ])("retains the native browser tel value through disabled pending and controller error (%s)", async (_scenario, failure) => {
    let reject!: (error: Error) => void;
    sendMock.mockImplementation(() => new Promise<void>((_, fail) => { reject = fail; }));
    renderController();
    openController();

    const phone = await screen.findByLabelText(/Телефон/) as HTMLInputElement;
    act(() => nativeInput(phone, "+7 981 838-48-31"));
    fireEvent.change(screen.getByLabelText("Комментарий"), { target: { value: "Не очищать" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.submit(phone.closest("form")!);
    await waitFor(() => expect(sendMock).toHaveBeenCalledOnce());
    expect(sendMock).toHaveBeenCalledWith(expect.objectContaining({ phone: "+7 981 838-48-31" }));
    expect((screen.getByLabelText(/Телефон/) as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText(/Телефон/) as HTMLInputElement).value).toBe("+7 981 838-48-31");

    reject(failure);
    await waitFor(() => {
      const restoredPhone = screen.getByLabelText(/Телефон/) as HTMLInputElement;
      expect(restoredPhone.disabled).toBe(false);
      expect(restoredPhone.value).toBe("+7 981 838-48-31");
      expect((screen.getByLabelText("Комментарий") as HTMLTextAreaElement).value).toBe("Не очищать");
      expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(true);
    });
  });

  it("unmounts a successful session and reopens with a fresh idle form", async () => {
    sendMock.mockResolvedValue();
    renderController();
    openController();
    await screen.findByRole("dialog");
    fillValid();
    fireEvent.submit(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel }).closest("form")!);
    expect(await screen.findByRole("status")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Закрыть" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    openController({ route: "/about" });

    await screen.findByRole("dialog");
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByLabelText("Имя") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText(/Телефон/) as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Комментарий") as HTMLTextAreaElement).value).toBe("");
    expect((screen.getByRole("checkbox") as HTMLInputElement).checked).toBe(false);
    expect(screen.getByRole("button", { name: FALLBACK_SHARED_SETTINGS.callback.submitLabel })).toBeTruthy();
  });
});
