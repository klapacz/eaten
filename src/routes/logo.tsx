import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/logo')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="p-4">
      <img src="/logo.svg" alt="Logo" />
    </div>
  )
}
