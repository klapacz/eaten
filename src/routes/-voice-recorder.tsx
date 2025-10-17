import React, { useEffect, useRef } from 'react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import { useServerFn } from '@tanstack/react-start'
import { Temporal } from 'temporal-polyfill'
import { useIsMutating, useMutation } from '@tanstack/react-query'
import { useWavesurfer } from '@wavesurfer/react'
import { toast } from 'sonner'
import { transcribeServer } from '@/data/meal'

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
