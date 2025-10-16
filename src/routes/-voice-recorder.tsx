import React, { useEffect, useRef } from 'react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import { env } from 'cloudflare:workers'
import z from 'zod'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { generateObject } from 'ai'
import { google } from '@ai-sdk/google'
import { createInsertSchema } from 'drizzle-zod'
import { mealTable } from '@/db/schema'
import { DB } from '@/db/client'
import { Temporal } from 'temporal-polyfill'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { useWavesurfer } from '@wavesurfer/react'
import { toast } from 'sonner'
import { AuthContext } from '@/auth/server'

type VoiceRecorderInnerProps = {
  onOpen: (data: { mealId: string }) => void
}

type VoiceRecorderProps = React.PropsWithChildren<VoiceRecorderInnerProps>

export function VoiceRecorder({ children, ...props }: VoiceRecorderProps) {
  return (
    <Popover>
      {children}
      <PopoverContent className="w-96 p-2" placement="bottom start">
        <VoiceRecorderInner {...props} />
      </PopoverContent>
    </Popover>
  )
}

const transcribeServerFormDataSchema = z.object({
  audio: z.file(),
  today: z.iso.date(),
})

const transcribeServer = createServerFn({ method: 'POST' })
  .inputValidator(z.instanceof(FormData))
  .handler(async ({ data: _data }) => {
    const session = await AuthContext.getSession()
    const data = transcribeServerFormDataSchema.parse(
      Object.fromEntries(_data.entries()),
    )

    // https://github.com/craigsdennis/autotranscriber-r2-workers-ai
    const aBuffer = await data.audio.arrayBuffer()
    const base64String = Buffer.from(aBuffer).toString('base64')

    const results = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: base64String,
    })

    const transcript = results.text
    console.log({ transcript })

    const schema = createInsertSchema(mealTable).omit({
      id: true,
      userId: true,
    })

    const { object } = await generateObject({
      model: google('gemini-2.5-pro'),
      schema,
      prompt: `Extract meal information from this voice transcript: "${transcript}"

Current date: ${data.today}

Instructions:
- Parse the meal name/description from what the user said
- If the user mentions a specific date or time (e.g., "yesterday", "this morning", "at 3pm"), calculate the appropriate datetime relative to ${data.today}
- Extract any mentioned nutritional information or details
- Be flexible with informal language (e.g., "I had pizza" → meal name: "pizza")`,
    })

    console.log({ object })

    const [insertedMeal] = await DB.use((db) =>
      db
        .insert(mealTable)
        .values({ ...object, userId: session.user.id })
        .returning()
        .execute(),
    )

    console.log({ insertedMeal })

    return insertedMeal
  })

const TRANSRIBE_MUTATION_KEY = ['transcribe']

export function useTransribeMutation() {
  const transcribe = useServerFn(transcribeServer)

  return useMutation({
    mutationKey: TRANSRIBE_MUTATION_KEY,
    async mutationFn(blob: Blob) {
      const formData = new FormData()
      formData.append('audio', blob)
      formData.append('today', Temporal.Now.plainDateISO().toString())
      return transcribe({ data: formData })
    },
  })
}

export function useIsTransribeMutationMutating() {
  return useIsMutating({ mutationKey: TRANSRIBE_MUTATION_KEY })
}

function VoiceRecorderInner(props: VoiceRecorderInnerProps) {
  const transcribeMutation = useTransribeMutation()
  const containerRef = useRef<HTMLDivElement>(null)

  const { wavesurfer } = useWavesurfer({
    container: containerRef!,
    waveColor: '#1891a2',
    height: 56,
    barGap: 2,
    barWidth: 3,
    cursorWidth: 0,
    minPxPerSec: 0.5,
    sampleRate: 8000,
  })

  useEffect(() => {
    if (!wavesurfer) return

    const record = wavesurfer.registerPlugin(
      RecordPlugin.create({
        scrollingWaveform: true,
        renderRecordedAudio: false,
      }),
    )

    record.on('record-end', (blob) => {
      toast.promise(transcribeMutation.mutateAsync(blob), {
        loading: 'Transcribing...',
        success: (data) => ({
          message: 'Transcription complete.',
          action: {
            label: 'View',
            onClick: () => props.onOpen({ mealId: data.id }),
          },
        }),
        error: 'Failed to transcribe.',
      })
    })

    record.startRecording()

    return () => {
      record.stopRecording()
      wavesurfer.unregisterPlugin(record)
    }
  }, [wavesurfer])

  return <div ref={containerRef} />
}
