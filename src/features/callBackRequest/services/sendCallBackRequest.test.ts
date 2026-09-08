import { beforeEach, describe, expect, it, vi } from "vitest";

import { callBackRequestCreate } from "@/api/callBackRequest";
import { CallBackRequestError, sendCallBackRequest } from "./sendCallBackRequest";

vi.mock("@/api/callBackRequest", () => ({ callBackRequestCreate: vi.fn() }));

const createMock = vi.mocked(callBackRequestCreate);
const payload = { name: "Visitor", phone: "+10000000000" };

describe("callback request service", () => {
  beforeEach(() => createMock.mockReset());

  it("delegates valid payload to the public callback wrapper", async () => {
    createMock.mockResolvedValue({ status: "ok", data: undefined });

    await expect(sendCallBackRequest(payload)).resolves.toBeUndefined();
    expect(createMock).toHaveBeenCalledWith(payload);
  });

  it("exposes a normalized service error", async () => {
    createMock.mockResolvedValue({
      status: "error",
      statusCode: 400,
      data: { detail: "Invalid payload" },
    });

    await expect(sendCallBackRequest(payload)).rejects.toEqual(
      new CallBackRequestError("Invalid payload", 400),
    );
  });
});
