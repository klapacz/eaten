import { CreateMealTypeSheetContent } from '@/components/meal-type/create-meal-type-sheet-content'
import { Sheet } from '@/components/ui/sheet'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/meal-type/add')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/meal-type', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => <CreateMealTypeSheetContent close={close} />}
      </Sheet.Content>
    </Sheet>
  )
}
