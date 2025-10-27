#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HARDHAT_DIR = path.resolve(__dirname, '../../fhevm-hardhat-template');
const DEPLOYMENTS_DIR = path.join(HARDHAT_DIR, 'deployments');
const ABI_OUTPUT_DIR = path.resolve(__dirname, '../abi');

const NETWORKS = ['localhost', 'sepolia'];
const CONTRACT_NAME = 'SecretBallot';

// Ensure output directory exists
if (!fs.existsSync(ABI_OUTPUT_DIR)) {
  fs.mkdirSync(ABI_OUTPUT_DIR, { recursive: true });
}

// Generate ABI file
function generateABI() {
  let foundABI = null;
  
  for (const network of NETWORKS) {
    const deploymentPath = path.join(DEPLOYMENTS_DIR, network, `${CONTRACT_NAME}.json`);
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      foundABI = deployment.abi;
      console.log(`✓ Found ABI from ${network} deployment`);
      break;
    }
  }
  
  if (!foundABI) {
    console.warn('⚠ No deployment found. ABI file will be empty.');
    foundABI = [];
  }
  
  const abiContent = `// Auto-generated from ${CONTRACT_NAME} deployment
// Do not edit manually

export const ${CONTRACT_NAME}ABI = ${JSON.stringify(foundABI, null, 2)} as const;
`;
  
  fs.writeFileSync(path.join(ABI_OUTPUT_DIR, `${CONTRACT_NAME}ABI.ts`), abiContent);
  console.log(`✓ Generated ${CONTRACT_NAME}ABI.ts`);
}

// Generate addresses file
function generateAddresses() {
  const addresses = {};
  
  for (const network of NETWORKS) {
    const deploymentPath = path.join(DEPLOYMENTS_DIR, network, `${CONTRACT_NAME}.json`);
    if (fs.existsSync(deploymentPath)) {
      const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
      addresses[network] = deployment.address;
      console.log(`✓ Found address for ${network}: ${deployment.address}`);
    }
  }
  
  if (Object.keys(addresses).length === 0) {
    console.warn('⚠ No deployments found. Address file will be empty.');
  }
  
  const addressContent = `// Auto-generated from ${CONTRACT_NAME} deployments
// Do not edit manually

export const ${CONTRACT_NAME}Addresses = ${JSON.stringify(addresses, null, 2)} as const;

export type NetworkName = keyof typeof ${CONTRACT_NAME}Addresses;

export function get${CONTRACT_NAME}Address(networkName: string): string | undefined {
  return ${CONTRACT_NAME}Addresses[networkName as NetworkName];
}
`;
  
  fs.writeFileSync(path.join(ABI_OUTPUT_DIR, `${CONTRACT_NAME}Addresses.ts`), addressContent);
  console.log(`✓ Generated ${CONTRACT_NAME}Addresses.ts`);
}

// Main execution
console.log('🔧 Generating ABI and addresses...\n');
generateABI();
generateAddresses();
console.log('\n✅ ABI generation complete!');


