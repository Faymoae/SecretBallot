#!/usr/bin/env node
import http from 'http';

const HARDHAT_NODE_URL = 'http://localhost:8545';
const EXPECTED_CHAIN_ID = 31337;

async function checkHardhatNode() {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_chainId',
      params: [],
      id: 1,
    });

    const options = {
      hostname: 'localhost',
      port: 8545,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 2000,
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          const chainId = parseInt(response.result, 16);
          
          if (chainId === EXPECTED_CHAIN_ID) {
            console.log(`✓ Hardhat node is running (chainId: ${chainId})`);
            resolve(true);
          } else {
            console.error(`✗ Wrong chainId: ${chainId} (expected ${EXPECTED_CHAIN_ID})`);
            resolve(false);
          }
        } catch (error) {
          console.error('✗ Failed to parse response:', error.message);
          resolve(false);
        }
      });
    });

    req.on('error', () => {
      console.error(`✗ Hardhat node is not running on ${HARDHAT_NODE_URL}`);
      console.error('  Please start it with: cd fhevm-hardhat-template && npx hardhat node');
      resolve(false);
    });

    req.on('timeout', () => {
      console.error('✗ Connection timeout');
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

// Main execution
const isRunning = await checkHardhatNode();
if (!isRunning) {
  process.exit(1);
}


