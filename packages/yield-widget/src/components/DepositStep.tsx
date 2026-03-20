import type { TargetPool } from '../types'

type DepositStepProps = {
  targetPool: TargetPool
  depositStatus: 'idle' | 'approving' | 'depositing' | 'success' | 'error'
  depositTxHash: string | null
  approvalTxHash: string | null
  error: string | null
  theme: 'light' | 'dark' | Record<string, unknown>
}

export const DepositStep = ({
  targetPool,
  depositStatus,
  depositTxHash,
  approvalTxHash,
  error,
  theme,
}: DepositStepProps) => {
  const isDark = theme === 'dark' || (typeof theme === 'object' && theme.mode === 'dark')

  const statusMessages: Record<string, { title: string; description: string }> = {
    idle: {
      title: 'Ready to deposit',
      description: `Depositing into ${targetPool.protocol} ${targetPool.poolName || ''}`,
    },
    approving: {
      title: 'Approving token...',
      description: `Approve ${targetPool.depositToken.symbol} for ${targetPool.protocol}`,
    },
    depositing: {
      title: 'Depositing...',
      description: `Depositing into ${targetPool.poolName || targetPool.protocol}`,
    },
    success: {
      title: 'Deposit complete!',
      description: `Successfully deposited into ${targetPool.poolName || targetPool.protocol}`,
    },
    error: {
      title: 'Deposit failed',
      description: error || 'An error occurred during deposit',
    },
  }

  const current = statusMessages[depositStatus] || statusMessages.idle

  return (
    <div
      className="yield-deposit-step"
      style={{
        padding: '24px',
        textAlign: 'center',
        color: isDark ? '#ffffff' : '#000000',
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
        {current.title}
      </div>
      <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>
        {current.description}
      </div>

      {depositStatus === 'approving' || depositStatus === 'depositing' ? (
        <div className="yield-spinner" style={{ margin: '16px auto' }}>
          ⏳
        </div>
      ) : null}

      {depositStatus === 'success' && (
        <div style={{ color: '#22c55e', fontSize: '32px', margin: '16px 0' }}>✓</div>
      )}

      {depositStatus === 'error' && (
        <div style={{ color: '#ef4444', fontSize: '32px', margin: '16px 0' }}>✗</div>
      )}

      {approvalTxHash && (
        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '8px' }}>
          Approval TX: {approvalTxHash.slice(0, 10)}...{approvalTxHash.slice(-8)}
        </div>
      )}

      {depositTxHash && (
        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>
          Deposit TX: {depositTxHash.slice(0, 10)}...{depositTxHash.slice(-8)}
        </div>
      )}
    </div>
  )
}
