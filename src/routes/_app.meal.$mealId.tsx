import { Sheet } from '@/components/ui/sheet'
import { mealCollection } from '@/db-collections'
import { eq, useLiveQuery } from '@tanstack/react-db'
import { createFileRoute } from '@tanstack/react-router'
import { UpdateMealSheetContent } from '@/components/meal/update-meal-sheet-content'
import { MealRepo } from '@/db-collections/meal'
import z from 'zod'

export const Route = createFileRoute('/_app/meal/$mealId')({
  component: RouteComponent,
  validateSearch: z.object({
    isUpdatingDuplicated: z.boolean().default(false).catch(false),
  }),
})

function RouteComponent() {
  const navigate = Route.useNavigate()
  const params = Route.useParams()
  const search = Route.useSearch()
  const { data: meal } = useLiveQuery(
    (q) =>
      q
        .from({ meal: mealCollection })
        .where(({ meal }) => eq(meal.id, params.mealId))
        .findOne(),
    [params.mealId],
  )

  if (!meal) {
    return null
  }

  return (
    <Sheet
      isOpen={true}
      onOpenChange={() => navigate({ to: '/meal', viewTransition: true })}
    >
      <Sheet.Content>
        {({ close }) => (
          <UpdateMealSheetContent
            meal={MealRepo.encoder.decode(meal)}
            close={close}
            isUpdatingDuplicated={search.isUpdatingDuplicated}
            onDuplicate={({ meal_id }) =>
              navigate({
                to: '.',
                params: { mealId: meal_id },
                search: { isUpdatingDuplicated: true },
              })
            }
          />
        )}
      </Sheet.Content>
    </Sheet>
  )
}
