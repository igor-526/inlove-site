import { describe, expect, it } from "vitest";
import { appendCallbackContext, callbackFormSchema, formatCallbackContext } from "./schema";

describe("CT-CB-01/02 callback schema", () => {
  it("accepts exact boundary lengths", () => {
    expect(callbackFormSchema.safeParse({ name: "n".repeat(127), phone: "1".repeat(63), comment: "c".repeat(2000), consent: true }).success).toBe(true);
  });

  it.each([
    { name: "", phone: "", comment: "", consent: true },
    { name: "", phone: "1".repeat(64), comment: "", consent: true },
    { name: "n".repeat(128), phone: "1", comment: "", consent: true },
    { name: "", phone: "1", comment: "c".repeat(2001), consent: true },
    { name: "", phone: "1", comment: "", consent: false },
  ])("rejects invalid boundary %#", (values) => expect(callbackFormSchema.safeParse(values).success).toBe(false));

  it("CT-NOTE-CB-01 excludes page context and keeps entity context within 2000 characters", () => {
    const context = { route: "/loshadi", serviceName: "Прогулка", tariffName: "Первый", horseName: "Искра" };
    expect(formatCallbackContext(context)).toBe("Услуга: Прогулка\nТариф: Первый\nЛошадь: Искра");
    const comment = appendCallbackContext("x".repeat(1990), context);
    expect(comment).toHaveLength(2000);
    expect(comment).toContain("Лошадь: Искра");
    expect(comment).not.toContain("Страница:");
    expect(comment).not.toContain("/loshadi");
    expect(comment).not.toContain("undefined");
  });

  it("does not create a comment from route alone", () => {
    expect(formatCallbackContext({ route: "/about" })).toBe("");
    expect(appendCallbackContext("", { route: "/about" })).toBeUndefined();
  });
});
