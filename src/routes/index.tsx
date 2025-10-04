import { FileTrigger } from '@/components/ui/file-trigger'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import { env } from 'cloudflare:workers'
import z from 'zod'

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

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const transcribe = useServerFn(transcribeServer)

  return (
    <div>
      <FileTrigger
        onSelect={(fileList) => {
          if (!fileList) return
          const arr = Array.from(fileList)

          arr.map((file) => {
            const formData = new FormData()
            formData.append('audio', file)
            transcribe({ data: formData }).then(console.log)
          })
        }}
      ></FileTrigger>
    </div>
  )
}
