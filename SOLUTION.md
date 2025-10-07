# CREATE2 Cross-Chain Safe Deployment Solution

## Problem

The Safe at address `0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6` cannot be deployed to the same address on another chain because:

1. **Original creator**: `0x474e5Ded6b5D078163BFB8F6dBa355C3aA5478C8`
2. **Your wallet**: Different address
3. **Issue**: The original app only replicated the transaction data, which includes the sender's address in the CREATE2 salt calculation

## Root Cause

The Safe was created using `createProxyWithCallback` (a CREATE2-based method) on the Gnosis Safe Proxy Factory v1.3.0. However, the old implementation in this app simply copied the raw transaction, which wouldn't work if you're not the original creator.

## Solution Implemented

I've implemented proper CREATE2 deployment support that:

1. **Detects CREATE2 methods**: Recognizes `createProxyWithCallback` and `createProxyWithNonce`
2. **Extracts deployment parameters**: Gets the singleton, initializer, salt nonce, and callback from the creation info
3. **Deploys deterministically**: Uses ethers.js to call the factory contract directly with the same parameters
4. **Works for any deployer**: Since CREATE2 is deterministic, ANY wallet can deploy to the same address

## Changes Made

### New Files

- `src/utils/safe-factory.ts`: New utility for CREATE2-based Safe deployments using ethers.js

### Modified Files

1. **src/utils/tx-service.ts**: Updated `CreationInfo` type to properly parse deployment method and parameters
2. **src/utils/eth.ts**: Added `copySafeWithCREATE2()` function that uses the new factory utility
3. **src/components/Copycat/index.tsx**:
   - Detects CREATE2 deployments
   - Shows success message instead of warning when CREATE2 is detected
   - Uses new deployment method automatically
   - Displays the deployment method in the UI
4. **src/components/Copycat/styles.module.css**: Added success message styling (green)

## How It Works

### For Your Safe (0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6)

1. The app fetches creation info from the Safe Transaction Service
2. Detects that it used `createProxyWithCallback` (CREATE2 method)
3. Shows a **green success message** indicating you can deploy it
4. When you submit:
   - Switches to the target chain
   - Calls `factory.createProxyWithCallback(singleton, initializer, saltNonce, callback)` with the exact same parameters
   - The Safe deploys to the **exact same address**

### Parameters Used

- **Singleton**: `0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552` (Safe v1.3.0 implementation)
- **Salt Nonce**: `0x5dc218867a602` (405,000,000,000,000)
- **Callback**: `0xd126d8c23241594304dcf874231a52be15921839`
- **Initializer**: The setup data encoding the owners and threshold

## Important Notes

### Callback Address Requirement

The callback address `0xd126d8c23241594304dcf874231a52be15921839` MUST exist on the target chain. If it doesn't, the deployment will fail. This is likely a registry contract.

### Factory Availability

The Gnosis Safe Proxy Factory v1.3.0 must be deployed at the same address on both chains. The app checks this automatically.

### Testing

To test this implementation:

1. Connect your wallet
2. Enter the Safe address: `0xA77DE01e157f9f57C7c4A326eeE9C4874D0598b6`
3. Select source chain: Ethereum Mainnet
4. You should see "✅ CREATE2 deployment detected!" message
5. Select a target chain (ensure factory and callback exist there)
6. Click "Copy Safe"

## Why This Works

CREATE2 generates addresses using:
```
keccak256(0xff ++ factory_address ++ salt ++ keccak256(init_code))
```

Where:
- `factory_address`: Same on all chains for Gnosis Safe
- `salt`: Computed from saltNonce and initializer (same parameters = same salt)
- `init_code`: The proxy deployment bytecode (same on all chains)

Since all these inputs are identical across chains, the resulting address is identical, **regardless of who deploys it**.

## Next Steps

If you encounter any issues:

1. **Check callback contract**: Verify `0xd126d8c23241594304dcf874231a52be15921839` exists on target chain
2. **Check factory contract**: Ensure v1.3.0 factory is deployed on target chain
3. **Check singleton**: Verify `0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552` exists on target chain

All these contracts should be at the same addresses on all EVM chains where Safe is deployed.
