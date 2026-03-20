import { useEffect, useRef } from 'react'
import type { WalletClient } from 'viem'
import {
  createPublicClient,
  encodeFunctionData,
  http,
  parseAbi,
} from 'viem'

import { switchOrAddChain, VIEM_CHAINS_BY_ID } from '../constants/viemChains'
import { useYieldWallet } from '../contexts/YieldWalletContext'
import { YieldMachineCtx } from '../machines/YieldMachineContext'
import { getEvmNetworkId } from '../types'

/**
 * Standard deposit ABIs for supported yield protocols.
 * Each protocol may use a different function signature.
 */
const DEPOSIT_ABIS = {
  /** Morpho / ERC-4626 style: deposit(uint256 assets, address receiver) */
  morpho: parseAbi(['function deposit(uint256 assets, address receiver) returns (uint256 shares)']),
  /** Aave V3: supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) */
  aave: parseAbi([
    'function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)',
  ]),
  /** Compound V3 (Comet): supply(address asset, uint256 amount) */
  compound: parseAbi(['function supply(address asset, uint256 amount)']),
  /** Beefy: deposit(uint256 _amount) */
  beefy: parseAbi(['function deposit(uint256 _amount)']),
} as const

/**
 * Executes the on-chain deposit into the target yield pool after the
 * swap+bridge has completed and (optionally) the deposit token has been approved.
 *
 * Follows the same effect-driven pattern as useYieldExecution — watches for the
 * `depositing` state and fires the transaction.
 */
export const useYieldDeposit = () => {
  const stateValue = YieldMachineCtx.useSelector(s => s.value)
  const context = YieldMachineCtx.useSelector(s => s.context)
  const actorRef = YieldMachineCtx.useActorRef()

  const { walletClient, walletAddress } = useYieldWallet()

  const depositingRef = useRef(false)

  useEffect(() => {
    const snap = actorRef.getSnapshot()
    if (!snap.matches('depositing') || depositingRef.current) return
    depositingRef.current = true

    const executeDeposit = async () => {
      try {
        const pool = context.targetPool
        if (!pool) {
          actorRef.send({ type: 'DEPOSIT_ERROR', error: 'No target pool configured' })
          return
        }

        if (!walletClient || !walletAddress) {
          actorRef.send({ type: 'DEPOSIT_ERROR', error: 'No wallet connected' })
          return
        }

        if (!context.isBuyAssetEvm) {
          actorRef.send({
            type: 'DEPOSIT_ERROR',
            error: `Deposit not supported for non-EVM target chain. Pool chain: ${pool.chainId}`,
          })
          return
        }

        const requiredChainId = getEvmNetworkId(pool.chainId)
        const client = walletClient as WalletClient

        const currentChainId = await client.getChainId()
        if (currentChainId !== requiredChainId) {
          await switchOrAddChain(client, requiredChainId)
        }

        const viemChain = VIEM_CHAINS_BY_ID[requiredChainId]
        if (!viemChain) {
          throw new Error(`Unsupported chain ID ${requiredChainId} for deposit.`)
        }

        // Determine deposit amount from the quote's buy amount (what we received from the swap)
        const quote = context.quote
        const buyAmountBaseUnit =
          quote?.steps?.[0]?.buyAmountCryptoBaseUnit ??
          quote?.quote?.steps?.[0]?.buyAmountCryptoBaseUnit ??
          context.sellAmountBaseUnit // fallback for direct deposits
        if (!buyAmountBaseUnit || buyAmountBaseUnit === '0') {
          throw new Error('Cannot determine deposit amount from quote')
        }

        const depositAmount = BigInt(buyAmountBaseUnit)

        // Build the deposit calldata
        let txData: `0x${string}`

        if (pool.depositCalldata) {
          // Custom calldata provided by the integrator — use as-is
          txData = pool.depositCalldata as `0x${string}`
        } else if (pool.depositFunction) {
          // Custom function signature — encode with standard args
          const customAbi = parseAbi([`function ${pool.depositFunction}`])
          txData = encodeFunctionData({
            abi: customAbi,
            functionName: pool.depositFunction.split('(')[0],
            args: [depositAmount, walletAddress as `0x${string}`],
          })
        } else {
          // Use protocol-specific ABI
          const protocol = pool.protocol as keyof typeof DEPOSIT_ABIS
          const abi = DEPOSIT_ABIS[protocol]

          if (!abi) {
            throw new Error(
              `No deposit ABI for protocol "${pool.protocol}". ` +
                `Provide depositCalldata or depositFunction in pool config.`,
            )
          }

          const depositTokenAddress = pool.depositToken.assetId.split('/')[1]?.split(':')[1]

          switch (protocol) {
            case 'morpho':
              txData = encodeFunctionData({
                abi: DEPOSIT_ABIS.morpho,
                functionName: 'deposit',
                args: [depositAmount, walletAddress as `0x${string}`],
              })
              break
            case 'aave':
              txData = encodeFunctionData({
                abi: DEPOSIT_ABIS.aave,
                functionName: 'supply',
                args: [
                  depositTokenAddress as `0x${string}`,
                  depositAmount,
                  walletAddress as `0x${string}`,
                  0, // referral code
                ],
              })
              break
            case 'compound':
              txData = encodeFunctionData({
                abi: DEPOSIT_ABIS.compound,
                functionName: 'supply',
                args: [depositTokenAddress as `0x${string}`, depositAmount],
              })
              break
            case 'beefy':
              txData = encodeFunctionData({
                abi: DEPOSIT_ABIS.beefy,
                functionName: 'deposit',
                args: [depositAmount],
              })
              break
            default:
              throw new Error(`Unhandled protocol: ${protocol}`)
          }
        }

        const txHash = await client.sendTransaction({
          to: pool.address as `0x${string}`,
          data: txData,
          value: BigInt(0),
          chain: viemChain,
          account: walletAddress as `0x${string}`,
        })

        actorRef.send({ type: 'DEPOSIT_SUCCESS', txHash })
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error) ?? 'Deposit failed'
        actorRef.send({ type: 'DEPOSIT_ERROR', error: errorMessage })
      } finally {
        depositingRef.current = false
      }
    }

    executeDeposit()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stateValue is the sole trigger
  }, [stateValue])
}
