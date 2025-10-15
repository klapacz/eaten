import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/_index/')({
  component: RouteComponent,
})

function RouteComponent() {
  return null
}
