import './PoolInfoHeader.css'

import type { TargetPool } from '../types'

type PoolInfoHeaderProps = {
  pool: TargetPool
}

export const PoolInfoHeader = ({ pool }: PoolInfoHeaderProps) => {
  return (
    <div className='ssw-pool-info'>
      <div className='ssw-pool-info-left'>
        {pool.protocolIcon ? (
          <img src={pool.protocolIcon} alt={pool.protocol} className='ssw-pool-protocol-icon' />
        ) : (
          <div className='ssw-pool-protocol-icon-placeholder'>
            {pool.protocol.charAt(0).toUpperCase()}
          </div>
        )}
        <div className='ssw-pool-info-text'>
          <span className='ssw-pool-protocol-name'>{pool.protocol}</span>
          {pool.poolName && <span className='ssw-pool-name'>{pool.poolName}</span>}
        </div>
      </div>
      {pool.apy && (
        <div className='ssw-pool-apy'>
          <span className='ssw-pool-apy-label'>APY</span>
          <span className='ssw-pool-apy-value'>{pool.apy}%</span>
        </div>
      )}
    </div>
  )
}
