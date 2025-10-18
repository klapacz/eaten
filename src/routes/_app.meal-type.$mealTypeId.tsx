import { Sheet } from '@/components/ui/sheet'
import { mealTypeCollection } from '@/db-collections'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute } from '@tanstack/react-router'
import { UpdateMealTypeSheetContent } from './-meal-type-shared'

export const Route = createFileRoute('/_app/meal-type/$mealTypeId')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const params = Route.useParams()
  const { data: mealType } = useLiveQuery(
    (q) =>
      q
        .from({ type: mealTypeCollection })
        .where(({ type }) => eq(type.id, params.mealTypeId))
        .findOne(),
    [params.mealTypeId],
  )

  if (!mealType) {
    return null
  }

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/meal-type', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => (
          <UpdateMealTypeSheetContent mealType={mealType} close={close} />
        )}
      </Sheet.Content>
    </Sheet>
  )
}
