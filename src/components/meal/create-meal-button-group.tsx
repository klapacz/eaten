import { Button, buttonStyles } from '@/components/ui/button'
import { IconPlus, IconVoice } from '@intentui/icons'
import { ButtonGroup } from '@/components/ui/button-group'
import { Link } from '@/components/ui/link'
import { useIsMobile } from '@/hooks/use-is-mobile'
import {
  RegisteredRouter,
  useNavigate,
  ValidateLinkOptions,
  ValidateNavigateOptions,
} from '@tanstack/react-router'
import { VoiceRecorder } from './voice-recorder'

export interface CreateMealButtonGroupProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TCreateMealOptions = unknown,
  TUpdateMealOptions = unknown,
> {
  createMealLinkOptions: ValidateLinkOptions<
    TRouter,
    TCreateMealOptions,
    string,
    typeof Link
  >
  updateMealNavigateOptions: (opts: {
    mealId: string
  }) => ValidateNavigateOptions<TRouter, TUpdateMealOptions>
}

export function CreateMealButtonGroup<
  TRouter extends RegisteredRouter,
  TCreateMealOptions,
  TUpdateMealOptions,
>(
  props: CreateMealButtonGroupProps<
    TRouter,
    TCreateMealOptions,
    TUpdateMealOptions
  >,
) {
  const isMobile = useIsMobile()
  const navigate = useNavigate()

  return (
    <ButtonGroup>
      <Link
        className={buttonStyles({
          intent: 'secondary',
          size: isMobile ? 'sq-sm' : 'sm',
        })}
        {...props.createMealLinkOptions}
      >
        <IconPlus />
        <span className="max-sm:sr-only">Create</span>
      </Link>
      <VoiceRecorder
        onOpen={({ mealId }) => {
          void navigate(props.updateMealNavigateOptions({ mealId }))
        }}
      >
        <Button size="sq-sm">
          <IconVoice />
        </Button>
      </VoiceRecorder>
    </ButtonGroup>
  )
}
