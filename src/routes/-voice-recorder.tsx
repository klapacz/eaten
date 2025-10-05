import React, { useEffect, useRef } from 'react'
import { Popover, PopoverContent } from '@/components/ui/popover'
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js'
import WaveSurfer from 'wavesurfer.js'
import { env } from 'cloudflare:workers'
import z from 'zod'
import { createServerFn, useServerFn } from '@tanstack/react-start'

type VoiceRecorderProps = React.PropsWithChildren

export function VoiceRecorder({ children }: VoiceRecorderProps) {
  return (
    <Popover>
      {children}
      <PopoverContent className="w-96 p-2" placement="bottom start">
        <VoiceRecorderInner />
      </PopoverContent>
    </Popover>
  )
}

const transcribeServer = createServerFn({ method: 'POST' })
  .inputValidator(z.instanceof(FormData))
  .handler(async ({ data }) => {
    const audio = z.file().parse(data.get('audio'))
    // https://github.com/craigsdennis/autotranscriber-r2-workers-ai
    const aBuffer = await audio.arrayBuffer()
    const base64String = Buffer.from(aBuffer).toString('base64')

    const results = await env.AI.run('@cf/openai/whisper-large-v3-turbo', {
      audio: base64String,
    })

    results.text

    console.log('Storing transcription in metadata', results)
  })

function VoiceRecorderInner() {
  const transcribe = useServerFn(transcribeServer)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const wavesurferInstance = WaveSurfer.create({
      container: containerRef.current!,
      waveColor: '#1891a2',
      height: 56,
      barGap: 2,
      barWidth: 3,
      cursorWidth: 0,
      minPxPerSec: 0.5,
      sampleRate: 8000,
    })

    const recordPluginInstance = RecordPlugin.create()

    wavesurferInstance.registerPlugin(recordPluginInstance)

    recordPluginInstance.on('record-end', (blob) => {
      const formData = new FormData()
      formData.append('audio', blob)
      transcribe({ data: formData }).then(console.log)
    })

    recordPluginInstance.startRecording()

    return () => {
      recordPluginInstance.stopRecording()
      wavesurferInstance.destroy()
    }
  }, [])

  return <div ref={containerRef} />
}
