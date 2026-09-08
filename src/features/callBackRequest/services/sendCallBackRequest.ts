import { callBackRequestCreate } from "@/api/callBackRequest";
import type { CallBackRequestInDto } from "@/types/callBackRequest";

export class CallBackRequestError extends Error {
  constructor(message: string, readonly statusCode?: number) {
    super(message);
    this.name = "CallBackRequestError";
  }
}

export const sendCallBackRequest = async (data: CallBackRequestInDto): Promise<void> => {
  const response = await callBackRequestCreate(data);

  if (response.status === "error") {
    throw new CallBackRequestError(
      response.data?.detail || "Unable to send callback request",
      response.statusCode,
    );
  }
};
