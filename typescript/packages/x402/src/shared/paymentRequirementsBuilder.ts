import { Address, getAddress } from "viem";
import { Address as SolanaAddress } from "@solana/kit";
import {
  ERC20TokenAmount,
  Network,
  PaymentRequirements,
  Resource,
  RouteConfig,
  SupportedEVMNetworks,
  SupportedSVMNetworks,
  SupportedPaymentKindsResponse,
} from "../types";
import { processPriceToAtomicAmount } from "./middleware";

/**
 * Input parameters for building payment requirements
 */
export interface BuildPaymentRequirementsInput {
  /** Address to receive payments */
  payTo: Address | SolanaAddress;
  /** Network to use */
  network: Network;
  /** Price configuration */
  price: RouteConfig["price"];
  /** Resource URL */
  resource: Resource;
  /** HTTP method */
  method: string;
  /** Optional description */
  description?: string;
  /** Optional MIME type */
  mimeType?: string;
  /** Maximum timeout in seconds */
  maxTimeoutSeconds?: number;
  /** Input schema for API documentation */
  inputSchema?: Record<string, unknown>;
  /** Output schema for API documentation */
  outputSchema?: Record<string, unknown>;
  /** Whether the resource is discoverable */
  discoverable?: boolean;
}

/**
 * Builds EVM payment requirements
 *
 * @param input - Payment requirements input
 * @returns EVM-specific payment requirements
 */
export function buildEvmPaymentRequirements(input: BuildPaymentRequirementsInput): PaymentRequirements {
  const {
    payTo,
    network,
    price,
    resource,
    method,
    description = "",
    mimeType = "application/json",
    maxTimeoutSeconds = 60,
    inputSchema,
    outputSchema,
    discoverable = true,
  } = input;

  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  if ("error" in atomicAmountForAsset) {
    throw new Error(atomicAmountForAsset.error);
  }

  const { maxAmountRequired, asset } = atomicAmountForAsset;

  return {
    scheme: "exact",
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType,
    payTo: getAddress(payTo),
    maxTimeoutSeconds,
    asset: getAddress(asset.address),
    outputSchema: {
      input: {
        type: "http",
        method: method.toUpperCase(),
        discoverable,
        ...inputSchema,
      },
      output: outputSchema,
    },
    extra: (asset as ERC20TokenAmount["asset"]).eip712,
  };
}

/**
 * Builds SVM (Solana) payment requirements
 *
 * @param input - Payment requirements input
 * @param supportedKinds - Supported payment kinds from facilitator
 * @returns SVM-specific payment requirements
 * @throws {Error} If no fee payer is found for the network
 */
export function buildSvmPaymentRequirements(
  input: BuildPaymentRequirementsInput,
  supportedKinds: SupportedPaymentKindsResponse,
): PaymentRequirements {
  const {
    payTo,
    network,
    price,
    resource,
    method,
    description = "",
    mimeType = "",
    maxTimeoutSeconds = 60,
    inputSchema,
    outputSchema,
    discoverable = true,
  } = input;

  const atomicAmountForAsset = processPriceToAtomicAmount(price, network);
  if ("error" in atomicAmountForAsset) {
    throw new Error(atomicAmountForAsset.error);
  }

  const { maxAmountRequired, asset } = atomicAmountForAsset;

  // Find the fee payer from supported payment kinds
  let feePayer: string | undefined;
  for (const kind of supportedKinds.kinds) {
    if (kind.network === network && kind.scheme === "exact") {
      feePayer = kind?.extra?.feePayer as string | undefined;
      break;
    }
  }

  if (!feePayer) {
    throw new Error(`The facilitator did not provide a fee payer for network: ${network}.`);
  }

  return {
    scheme: "exact",
    network,
    maxAmountRequired,
    resource,
    description,
    mimeType,
    payTo,
    maxTimeoutSeconds,
    asset: asset.address,
    outputSchema: {
      input: {
        type: "http",
        method: method.toUpperCase(),
        discoverable,
        ...inputSchema,
      },
      output: outputSchema,
    },
    extra: {
      feePayer,
    },
  };
}

/**
 * Builds payment requirements based on the network type
 *
 * @param input - Payment requirements input
 * @param supportedKinds - Optional supported payment kinds (required for SVM networks)
 * @returns Payment requirements for the specified network
 * @throws {Error} If network is unsupported or SVM network without supported kinds
 */
export async function buildPaymentRequirements(
  input: BuildPaymentRequirementsInput,
  getSupportedKinds?: () => Promise<SupportedPaymentKindsResponse>,
): Promise<PaymentRequirements[]> {
  const { network } = input;

  if (SupportedEVMNetworks.includes(network)) {
    return [buildEvmPaymentRequirements(input)];
  }

  if (SupportedSVMNetworks.includes(network)) {
    if (!getSupportedKinds) {
      throw new Error("getSupportedKinds is required for SVM networks");
    }
    const supportedKinds = await getSupportedKinds();
    return [buildSvmPaymentRequirements(input, supportedKinds)];
  }

  throw new Error(`Unsupported network: ${network}`);
}

/**
 * Type guard to check if a network is an EVM network
 */
export function isEvmNetwork(network: Network): boolean {
  return SupportedEVMNetworks.includes(network);
}

/**
 * Type guard to check if a network is an SVM network
 */
export function isSvmNetwork(network: Network): boolean {
  return SupportedSVMNetworks.includes(network);
}
