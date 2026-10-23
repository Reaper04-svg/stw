import { useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Schematic } from '../../types'
import { Button } from '../ui/Button'
import { Dialog } from '../ui/Dialog'
import { ImageViewer } from './ImageViewer'

export function SchematicDetail({
  item,
  index,
  total,
  wheelZoom,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
}: {
  item: Schematic
  index: number
  total: number
  wheelZoom: boolean
  hasPrev: boolean
  hasNext: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return
      if (document.querySelectorAll('[role="dialog"]').length > 1) return
      const target = event.target as HTMLElement | null
      if (
        target?.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]')
      ) {
        return
      }
      if (event.key === 'ArrowLeft' && hasPrev) {
        event.preventDefault()
        onPrev()
      }
      if (event.key === 'ArrowRight' && hasNext) {
        event.preventDefault()
        onNext()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [hasNext, hasPrev, onNext, onPrev])

  return (
    <Dialog
      onClose={onClose}
      title=""
      description=""
      size="full"
      showClose
      bodyClassName="!overflow-hidden p-0"
    >
      <div className="relative flex h-[calc(100dvh-6.5rem)] min-h-[280px] w-full items-center justify-center bg-black/60">
        <ImageViewer key={item.id} src={item.url} alt="" wheelZoom={wheelZoom} />

        {hasPrev ? (
          <div className="absolute left-2 top-1/2 z-10 -translate-y-1/2 sm:left-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onPrev}
              aria-label="Previous image"
              className="gap-1.5 px-2.5"
            >
              <ChevronLeft size={16} />
              Previous
            </Button>
          </div>
        ) : null}

        {hasNext ? (
          <div className="absolute right-2 top-1/2 z-10 -translate-y-1/2 sm:right-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={onNext}
              aria-label="Next image"
              className="gap-1.5 px-2.5"
            >
              Next
              <ChevronRight size={16} />
            </Button>
          </div>
        ) : null}

        <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/[0.12] bg-black/60 px-3 py-1 text-[11px] tabular-nums text-ash backdrop-blur-sm">
          {index + 1} / {total}
        </div>
      </div>
    </Dialog>
  )
}
