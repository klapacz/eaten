import { Sheet } from '@/components/ui/sheet'
import { mealCollection } from '@/db-collections'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { UpdateMealSheetContent } from './-shared'

export const Route = createFileRoute('/_index/$mealId')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const params = Route.useParams()
  const { data: meal } = useLiveQuery(
    (q) =>
      q
        .from({ meal: mealCollection })
        .where(({ meal }) => eq(meal.id, params.mealId))
        .findOne(),
    [params.mealId],
  )

  if (!meal) {
    return <Navigate to="/" />
  }

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => <UpdateMealSheetContent meal={meal} close={close} />}
      </Sheet.Content>
    </Sheet>
  )
}
