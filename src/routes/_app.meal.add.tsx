import { Sheet } from '@/components/ui/sheet'
import { createFileRoute } from '@tanstack/react-router'
import { CreateMealSheetContent } from '@/components/meal/create-meal-sheet-content'

export const Route = createFileRoute('/_app/meal/add')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/meal', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => <CreateMealSheetContent close={close} />}
      </Sheet.Content>
    </Sheet>
  )
}
