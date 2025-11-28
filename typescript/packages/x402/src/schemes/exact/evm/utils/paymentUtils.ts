import { safeBase64Encode, safeBase64Decode } from "../../../../shared";
import { Network, SupportedEVMNetworks, SupportedSVMNetworks } from "../../../../types";
import {
  PaymentPayload,
  PaymentPayloadSchema,
  ExactEvmPayload,
  ExactSvmPayload,
} from "../../../../types/verify";

/**
 * Encodes a payment payload into a base64 string, ensuring bigint values are properly stringified
 *
 * @param payment - The payment payload to encode
 * @returns A base64 encoded string representation of the payment payload
 */
export function encodePayment(payment: PaymentPayload): string {
  let safe: PaymentPayload;

  // evm
  if (SupportedEVMNetworks.includes(payment.network)) {
    const evmPayload = payment.payload as ExactEvmPayload;
    safe = {
      ...payment,
      payload: {
        ...evmPayload,
        authorization: Object.fromEntries(
          Object.entries(evmPayload.authorization).map(([key, value]) => [
            key,
            typeof value === "bigint" ? (value as bigint).toString() : value,
          ]),
        ) as ExactEvmPayload["authorization"],
      },
    };
    return safeBase64Encode(JSON.stringify(safe));
  }

  // svm
  if (SupportedSVMNetworks.includes(payment.network)) {
    safe = { ...payment, payload: payment.payload as ExactSvmPayload };
    return safeBase64Encode(JSON.stringify(safe));
  }

  throw new Error("Invalid network");
}

/**
 * Decodes a base64 encoded payment string back into a PaymentPayload object
 *
 * @param payment - The base64 encoded payment string to decode
 * @returns The decoded and validated PaymentPayload object
 * @throws {Error} If the payment string is malformed or cannot be parsed
 */
export function decodePayment(payment: string): PaymentPayload {
  const decoded = safeBase64Decode(payment);

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch (error) {
    throw new Error(
      `Failed to parse payment payload: ${error instanceof Error ? error.message : "Invalid JSON"}`,
    );
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Payment payload must be a valid object");
  }

  const payloadObj = parsed as Record<string, unknown>;
  if (!payloadObj.network || typeof payloadObj.network !== "string") {
    throw new Error("Payment payload missing required 'network' field");
  }

  let obj: PaymentPayload;

  const networkValue = payloadObj.network as Network;

  // evm
  if (SupportedEVMNetworks.includes(networkValue)) {
    obj = {
      ...payloadObj,
      payload: payloadObj.payload as ExactEvmPayload,
    } as PaymentPayload;
  }

  // svm
  else if (SupportedSVMNetworks.includes(networkValue)) {
    obj = {
      ...payloadObj,
      payload: payloadObj.payload as ExactSvmPayload,
    } as PaymentPayload;
  } else {
    throw new Error(`Unsupported network: ${payloadObj.network}`);
  }

  const validated = PaymentPayloadSchema.parse(obj);
  return validated;
}
