// Auto-generated from SecretBallot deployments
// Do not edit manually

export const SecretBallotAddresses = {
  "localhost": "0x69D910597839B5340490914FcB2f895983f7641B",
  "sepolia": "0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D"
} as const;

export type NetworkName = keyof typeof SecretBallotAddresses;

export function getSecretBallotAddress(networkName: string): string | undefined {
  return SecretBallotAddresses[networkName as NetworkName];
}
