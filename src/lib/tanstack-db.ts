import { Encoder } from './encoder'

type UpdaterFn<T> = (subject: T) => T

export function createUpdater<TRaw, TParsed>(opts: {
  encoder: Encoder<TRaw, TParsed>
}) {
  return function updated(updater: UpdaterFn<TParsed>) {
    return function update(draft: TRaw | TRaw[]) {
      const drafts = Array.isArray(draft) ? draft : [draft]

      drafts.forEach((draft) => {
        const deserialized = opts.encoder.decode(draft)
        const updated = updater(deserialized)
        const serialized = opts.encoder.encode(updated)

        for (const key in serialized) {
          draft[key] = serialized[key]
        }
      })
    }
  }
}
