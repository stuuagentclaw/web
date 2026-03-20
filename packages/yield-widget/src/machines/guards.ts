import type { YieldMachineContext } from './types'

export const hasValidInput = (context: YieldMachineContext): boolean => {
  return (
    !!context.sellAsset &&
    !!context.buyAsset &&
    !!context.sellAmountBaseUnit &&
    context.sellAmountBaseUnit !== '0'
  )
}

export const hasQuote = (context: YieldMachineContext): boolean => context.quote !== null

export const isApprovalRequired = (context: YieldMachineContext): boolean => {
  if (context.quote?.approval?.isRequired !== true || context.chainType !== 'evm') return false
  const assetIdParts = context.sellAsset.assetId.split('/')
  const namespace = assetIdParts[1]?.split(':')[0]
  return namespace === 'erc20'
}

export const canRetry = (context: YieldMachineContext): boolean => context.retryCount < 3

export const isEvmChain = (context: YieldMachineContext): boolean => context.chainType === 'evm'

export const isUtxoChain = (context: YieldMachineContext): boolean => context.chainType === 'utxo'

export const isSolanaChain = (context: YieldMachineContext): boolean =>
  context.chainType === 'solana'

export const hasWallet = (context: YieldMachineContext): boolean => !!context.walletAddress

export const hasReceiveAddress = (context: YieldMachineContext): boolean =>
  !!context.effectiveReceiveAddress
