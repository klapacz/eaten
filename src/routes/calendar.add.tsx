import { Sheet } from '@/components/ui/sheet'
import { createFileRoute } from '@tanstack/react-router'
import { CreateMealSheetContent } from './-shared'

export const Route = createFileRoute('/calendar/add')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/calendar', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => <CreateMealSheetContent close={close} />}
      </Sheet.Content>
    </Sheet>
  )
}
