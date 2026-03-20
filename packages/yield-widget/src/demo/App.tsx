import './App.css'

import { YieldWidget } from '../components/YieldWidget'
import type { TargetPool } from '../types'

// Example: Morpho USDC pool on Katana
const morphoKatanaPool: TargetPool = {
  address: '0x...', // TODO: real Morpho vault address on Katana
  chainId: 'eip155:747474',
  protocol: 'morpho',
  poolName: 'USDC Lending Pool',
  apy: '5.2',
  depositToken: {
    assetId: 'eip155:747474/erc20:0x...', // TODO: real USDC address on Katana
    chainId: 'eip155:747474',
    symbol: 'USDC',
    name: 'USD Coin',
    precision: 6,
  },
}

function App() {
  return (
    <div className="app-container">
      <h1>Yield Widget Demo</h1>
      <p>Deposit into Morpho on Katana from any token on any chain</p>
      <div className="widget-container">
        <YieldWidget
          targetPool={morphoKatanaPool}
          theme="dark"
          showPoolInfo={true}
          showPoweredBy={true}
          onDepositSuccess={(txHash) => console.log('Deposit success:', txHash)}
          onDepositError={(error) => console.error('Deposit failed:', error)}
        />
      </div>
    </div>
  )
}

export default App
