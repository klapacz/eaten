import { Button } from '@/components/ui/button'
import { FileTrigger } from '@/components/ui/file-trigger'
import { Table } from '@/components/ui/table'
import { mealCollection } from '@/db-collections'
import { db } from '@/db/client'
import { mealTable } from '@/db/schema'
import { useLiveQuery } from '@tanstack/react-db'
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

const addMealServer = createServerFn({ method: 'POST' }).handler(async () => {
  await db.insert(mealTable).values({ type: 'BRUNCH' }).execute()
})

export const Route = createFileRoute('/')({
  component: App,
  ssr: false,
})

function App() {
  const meals = useLiveQuery((q) => q.from({ meals: mealCollection }))
  const transcribe = useServerFn(transcribeServer)
  const addMeal = useServerFn(addMealServer)

  return (
    <div className="container mx-auto flex flex-col gap-6 p-4">
      <div className="flex gap-2">
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
        />
        <Button onPress={() => addMeal()}>Add meal</Button>
      </div>

      <Table aria-label="Meals">
        <Table.Header>
          <Table.Column isRowHeader>Type</Table.Column>
          <Table.Column>Items</Table.Column>
        </Table.Header>
        <Table.Body items={meals.data}>
          {(item) => (
            <Table.Row>
              <Table.Cell>{item.type}</Table.Cell>
              <Table.Cell>{item.items.join(', ')}</Table.Cell>
            </Table.Row>
          )}
        </Table.Body>
      </Table>
    </div>
  )
}
