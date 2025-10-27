/**
 * EIP-6963: Multi Injected Provider Discovery
 * Type definitions for wallet provider detection
 */

export interface EIP1193Provider {
  isStatus?: boolean;
  host?: string;
  path?: string;
  sendAsync?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void;
  send?: (
    request: { method: string; params?: Array<unknown> },
    callback: (error: Error | null, response: unknown) => void
  ) => void;
  request: (request: {
    method: string;
    params?: Array<unknown>;
  }) => Promise<unknown>;
  on?: (eventName: string, listener: (...args: any[]) => void) => void;
  removeListener?: (eventName: string, listener: (...args: any[]) => void) => void;
}

export interface EIP6963ProviderInfo {
  rdns: string;
  uuid: string;
  name: string;
  icon: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export type EIP6963AnnounceProviderEvent = CustomEvent<EIP6963ProviderDetail>;

export interface WalletProvider {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

