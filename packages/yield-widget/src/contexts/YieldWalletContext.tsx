import { createContext, useContext } from 'react'

import type { UseBitcoinSigningResult } from '../hooks/useBitcoinSigning'
import type { UseSolanaSigningResult } from '../hooks/useSolanaSigning'

export type YieldWalletContextValue = {
  walletClient: unknown
  walletAddress: string | undefined
  effectiveReceiveAddress: string
  isCustomAddress: boolean
  customReceiveAddress: string
  setCustomReceiveAddress: (address: string) => void
  bitcoin: UseBitcoinSigningResult
  solana: UseSolanaSigningResult
}

const YieldWalletContext = createContext<YieldWalletContextValue | null>(null)

export const YieldWalletProvider = YieldWalletContext.Provider

export const useYieldWallet = (): YieldWalletContextValue => {
  const ctx = useContext(YieldWalletContext)
  if (!ctx) throw new Error('useYieldWallet must be used within YieldWalletProvider')
  return ctx
}
