import { useEffect, useRef } from 'react'
import type { WalletClient } from 'viem'
import { createPublicClient, encodeFunctionData, erc20Abi, http, maxUint256 } from 'viem'

import { switchOrAddChain, VIEM_CHAINS_BY_ID } from '../constants/viemChains'
import { useYieldWallet } from '../contexts/YieldWalletContext'
import { YieldMachineCtx } from '../machines/YieldMachineContext'
import { getEvmNetworkId } from '../types'

/**
 * Handles ERC-20 approval for the deposit token → pool contract.
 * Mirrors the swap approval hook pattern but targets the pool address
 * and the deposit token (buyAsset side).
 */
export const useDepositApproval = () => {
  const stateValue = YieldMachineCtx.useSelector(s => s.value)
  const context = YieldMachineCtx.useSelector(s => s.context)
  const actorRef = YieldMachineCtx.useActorRef()

  const { walletClient, walletAddress } = useYieldWallet()

  const approvingRef = useRef(false)

  useEffect(() => {
    const snap = actorRef.getSnapshot()
    if (!snap.matches('deposit_approving') || approvingRef.current) return
    approvingRef.current = true

    const executeDepositApproval = async () => {
      try {
        if (!walletClient || !walletAddress) {
          actorRef.send({ type: 'APPROVAL_ERROR', error: 'No wallet connected' })
          return
        }

        const pool = context.targetPool
        if (!pool) {
          actorRef.send({ type: 'APPROVAL_ERROR', error: 'No target pool configured' })
          return
        }

        const depositTokenAddress = pool.depositToken.assetId.split('/')[1]?.split(':')[1]
        if (!depositTokenAddress || !/^0x[a-fA-F0-9]{40}$/.test(depositTokenAddress)) {
          actorRef.send({
            type: 'APPROVAL_ERROR',
            error: 'Deposit token is not an ERC-20 — approval not required',
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
          throw new Error(
            `Unsupported chain ID ${requiredChainId} for deposit approval.`,
          )
        }

        // Approve max to avoid repeat approvals for subsequent deposits
        const approvalData = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [pool.address as `0x${string}`, maxUint256],
        })

        const approvalHash = await client.sendTransaction({
          to: depositTokenAddress as `0x${string}`,
          data: approvalData,
          value: BigInt(0),
          chain: viemChain,
          account: walletAddress as `0x${string}`,
        })

        const rpcUrl = viemChain.rpcUrls?.default?.http?.[0]
        const publicClient = createPublicClient({
          chain: viemChain,
          transport: rpcUrl ? http(rpcUrl) : http(),
        })
        await publicClient.waitForTransactionReceipt({ hash: approvalHash })

        actorRef.send({ type: 'APPROVAL_SUCCESS', txHash: approvalHash })
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Deposit approval failed'
        actorRef.send({ type: 'APPROVAL_ERROR', error: errorMessage })
      } finally {
        approvingRef.current = false
      }
    }

    executeDepositApproval()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stateValue is the sole trigger
  }, [stateValue])
}
