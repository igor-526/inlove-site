import { describe, expect, it } from "vitest";
import { appendCallbackContext, callbackFormSchema, composedCallbackCommentSchema, formatCallbackContext } from "./schema";

describe("UT-CB71 callback schema", () => {
  it("UT-CB71-01 accepts the exact backend DTO boundaries after trim", () => {
    const result = callbackFormSchema.safeParse({ name: ` ${"n".repeat(127)} `, phone: ` ${"1".repeat(63)} `, comment: ` ${"c".repeat(2000)} `, consent: true });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toMatchObject({ name: "n".repeat(127), phone: "1".repeat(63), comment: "c".repeat(2000) });
  });

  it.each([
    { name: "", phone: "", comment: "", consent: true },
    { name: "", phone: "1".repeat(64), comment: "", consent: true },
    { name: "n".repeat(128), phone: "1", comment: "", consent: true },
    { name: "", phone: "1", comment: "c".repeat(2001), consent: true },
    { name: "", phone: "1", comment: "", consent: false },
  ])("UT-CB71-02 rejects an invalid boundary %#", (values) => expect(callbackFormSchema.safeParse(values).success).toBe(false));

  it("UT-CB71-03 normalizes whitespace optional fields to absence", () => {
    const result = callbackFormSchema.parse({ name: " \n ", phone: " +79991234567 ", comment: "\t", consent: true });
    expect(result).toEqual({ name: undefined, phone: "+79991234567", comment: undefined, consent: true });
  });

  it("UT-CB71-04 composes entity context losslessly and validates the final boundary", () => {
    const context = { route: "/loshadi", serviceName: "Прогулка", tariffName: "Первый", horseName: "Искра" };
    const contextText = "Услуга: Прогулка\nТариф: Первый\nЛошадь: Искра";
    expect(formatCallbackContext(context)).toBe(contextText);
    const exact = appendCallbackContext("x".repeat(2000 - contextText.length - 2), context);
    const overflow = appendCallbackContext("x".repeat(2000 - contextText.length - 1), context);
    expect(exact).toHaveLength(2000);
    expect(composedCallbackCommentSchema.safeParse(exact).success).toBe(true);
    expect(overflow).toHaveLength(2001);
    expect(composedCallbackCommentSchema.safeParse(overflow).success).toBe(false);
    expect(overflow).toContain(contextText);
    expect(overflow).not.toContain("Страница:");
    expect(overflow).not.toContain("/loshadi");
  });

  it("does not create a comment from route alone", () => {
    expect(formatCallbackContext({ route: "/about" })).toBe("");
    expect(appendCallbackContext("", { route: "/about" })).toBeUndefined();
  });
});
