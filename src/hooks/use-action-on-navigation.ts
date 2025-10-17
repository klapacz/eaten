import { useRouterState } from '@tanstack/react-router'
import { useEffect } from 'react'

export function useActionOnNavigation(action: () => void) {
  const routerState = useRouterState()

  useEffect(() => {
    if (routerState.status !== 'pending') {
      return
    }

    action()
  }, [routerState.status, action])
}
