import { createActorContext } from '@xstate/react'

import { yieldMachine } from './yieldMachine'

export const YieldMachineCtx = createActorContext(yieldMachine)
