import type { Schematic } from '../../types'
import { SchematicCard } from './SchematicCard'

export function Gallery({
  items,
  onOpen,
}: {
  items: Schematic[]
  onOpen: (id: string) => void
}) {
  return (
    <ul role="list" className="gallery-grid gallery-grid--comfortable">
      {items.map((item, index) => (
        <li key={item.id}>
          <SchematicCard item={item} priority={index < 4} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  )
}
