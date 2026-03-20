# @shapeshiftoss/yield-widget

An embeddable React widget that enables cross-chain yield deposits using ShapeShift's aggregation API. Users can deposit into any yield pool from any token on any chain in one transaction.

## Quick Start

```tsx
import { YieldWidget } from "@shapeshiftoss/yield-widget";

function App() {
  return (
    <YieldWidget
      partnerCode="your-partner-code"
      targetPool={{
        address: "0x...",
        chainId: "eip155:747474",
        protocol: "morpho",
        depositToken: {
          symbol: "USDC",
          address: "0x...",
          chainId: "eip155:747474",
          precision: 6,
        },
      }}
      theme="dark"
      onDepositSuccess={(txHash) => console.log("Deposited:", txHash)}
    />
  );
}
```

## How It Works

1. User selects any token they hold on any chain
2. Widget routes: swap → bridge → deposit in one flow
3. Handles token approvals automatically
4. Powered by ShapeShift's multi-chain aggregation (THORChain, Relay, Chainflip, 0x, etc.)

## Based On

Built on the same architecture as `@shapeshiftoss/swap-widget`. Same theming, wallet connection, and API patterns.
