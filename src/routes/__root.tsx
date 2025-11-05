import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'
import { RouterProvider } from 'react-aria-components'
import { Toast } from '@/components/ui/toast'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Eaten',
      },
      // iOS-specific meta tags for proper home screen app behavior
      {
        name: 'apple-mobile-web-app-capable',
        content: 'yes', // Enables standalone mode when added to home screen
      },
      {
        name: 'apple-mobile-web-app-status-bar-style',
        content: 'default', // Controls iOS status bar appearance (default, black, black-translucent)
      },
      {
        name: 'apple-mobile-web-app-title',
        content: 'Eaten', // Custom name shown on iOS home screen (defaults to <title> if omitted)
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'manifest',
        href: '/manifest.json',
      },
      {
        rel: 'icon',
        href: '/favicon.ico',
      },
      // Apple Touch Icons for iOS home screen bookmarks
      // iOS requires explicit apple-touch-icon links; it doesn't reliably use manifest.json icons
      // Without these, iOS may fallback to using favicon.ico (low resolution) instead
      {
        rel: 'apple-touch-icon',
        href: '/logo192.png',
        sizes: '192x192',
      },
      {
        rel: 'apple-touch-icon',
        href: '/logo512.png',
        sizes: '512x512',
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon-120x120.png',
        sizes: '120x120', // iPhone retina (@2x)
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon-152x152.png',
        sizes: '152x152', // iPad retina (@2x)
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon-167x167.png',
        sizes: '167x167', // iPad Pro (@2x)
      },
      {
        rel: 'apple-touch-icon',
        href: '/apple-touch-icon-180x180.png',
        sizes: '180x180', // iPhone Plus, iPhone X and newer (@3x)
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {/* See: https://github.com/adobe/react-spectrum/issues/8920#issuecomment-3383404322 */}
        <RouterProvider navigate={() => {}}>{children}</RouterProvider>
        <Toast />
        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
