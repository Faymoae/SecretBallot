# SecretBallot Sepolia 部署记录

## 📊 部署信息

### 合约地址
```
0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D
```

### 交易哈希
```
0xcd0a8b4dc96a2e1997965821f1ce7d35bb2b66acf3eb3ce74543cc4a2fb15c6a
```

### 部署区块
```
Block #9500689
```

### Gas 使用
```
2,157,966 gas
```

## 🔗 浏览器链接

### Etherscan
- [合约地址](https://sepolia.etherscan.io/address/0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D)
- [部署交易](https://sepolia.etherscan.io/tx/0xcd0a8b4dc96a2e1997965821f1ce7d35bb2b66acf3eb3ce74543cc4a2fb15c6a)

## 📝 部署步骤

### 1. 检查环境变量
```bash
npx hardhat vars list
```
需要配置：
- `MNEMONIC` - 部署账户助记词
- `INFURA_API_KEY` - Infura API 密钥

### 2. 编译合约
```bash
npx hardhat compile
```

### 3. 部署到 Sepolia
```bash
npx hardhat deploy --network sepolia --tags SecretBallot
```

### 4. 更新前端配置
```bash
cd secretballot-frontend
node scripts/genabi.mjs
```

## ✅ 验证结果

### 本地部署
- **网络**: localhost (Hardhat)
- **地址**: `0x69D910597839B5340490914FcB2f895983f7641B`

### 测试网部署
- **网络**: Sepolia
- **地址**: `0x88bdDd50d90bA6aAD22B38DdF5D3f987A36C258D`

## 🎯 下一步

### 测试网测试
1. 连接 MetaMask 到 Sepolia 网络
2. 确保有 Sepolia ETH（测试币）
3. 启动前端：`npm run dev`
4. 测试完整流程：
   - 创建提案
   - 投票
   - 请求解密
   - 查看结果

### 注意事项
- Sepolia 需要等待 Zama 的 Decryption Oracle 处理解密请求
- 解密可能需要几分钟时间
- 确保账户有足够的 ETH 支付 gas 费用

## 📊 合约功能

SecretBallot 智能合约提供了以下功能：

1. **createProposal** - 创建投票提案
2. **vote** - 投出加密选票
3. **requestDecryption** - 请求解密结果
4. **fulfillDecryption** - 提交解密结果（Oracle 调用）
5. **getProposal** - 查询提案信息
6. **getUserCreatedProposals** - 查询用户创建的提案
7. **getUserVotedProposals** - 查询用户投票记录
8. **getResults** - 获取投票结果

## 🔐 安全特性

- ✅ FHEVM 全同态加密
- ✅ 投票隐私保护
- ✅ 透明结果公布
- ✅ EIP-712 签名授权
- ✅ 防篡改机制

## 🌐 使用指南

### 开发环境（Mock 模式）
```bash
# 启动 Hardhat 节点
npx hardhat node

# 部署合约
npx hardhat deploy --network localhost

# 启动前端
cd secretballot-frontend
npm run dev:mock
```

### 测试网环境
```bash
# 启动前端（连接到 Sepolia）
cd secretballot-frontend
npm run dev
```

## 📅 部署时间

部署时间：2025-01-20
区块高度：9,500,689
网络：Sepolia Testnet

---

**合约已验证配置并成功部署到 Sepolia 测试网！** 🎉

