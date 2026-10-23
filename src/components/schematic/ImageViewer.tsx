import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ImageOff, Maximize2, Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn'
import { Tooltip } from '../ui/Tooltip'

const MIN_ZOOM = 1
const MAX_ZOOM = 6

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value))
}

export function ImageViewer({
  src,
  alt,
  wheelZoom,
}: {
  src: string
  alt: string
  wheelZoom: boolean
}) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [viewport, setViewport] = useState({ width: 1, height: 1 })
  const [zoom, setZoom] = useState(1)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')
  const [dragging, setDragging] = useState(false)
  const dragState = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const pendingAnchor = useRef<{
    ratio: number
    clientX: number
    clientY: number
    scrollLeft: number
    scrollTop: number
  } | null>(null)

  useEffect(() => {
    const element = viewportRef.current
    if (!element) return
    const update = () => {
      setViewport({
        width: Math.max(1, element.clientWidth),
        height: Math.max(1, element.clientHeight),
      })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const fitScale = natural
    ? Math.min(
        Math.max(1, viewport.width - 24) / natural.width,
        Math.max(1, viewport.height - 24) / natural.height,
        2,
      )
    : 0
  const baseWidth = natural ? Math.max(1, natural.width * fitScale) : 0
  const baseHeight = natural ? Math.max(1, natural.height * fitScale) : 0
  const displayWidth = baseWidth * zoom
  const displayHeight = baseHeight * zoom

  const applyZoom = useCallback(
    (nextValue: number, clientX?: number, clientY?: number) => {
      const next = clampZoom(nextValue)
      if (next === zoom) return
      const element = viewportRef.current
      if (element) {
        const bounds = element.getBoundingClientRect()
        const x = (clientX ?? bounds.left + element.clientWidth / 2) - bounds.left
        const y = (clientY ?? bounds.top + element.clientHeight / 2) - bounds.top
        pendingAnchor.current = {
          ratio: next / zoom,
          clientX: x,
          clientY: y,
          scrollLeft: element.scrollLeft,
          scrollTop: element.scrollTop,
        }
      }
      setZoom(next)
    },
    [zoom],
  )

  useLayoutEffect(() => {
    const element = viewportRef.current
    const anchor = pendingAnchor.current
    if (!element || !anchor) return
    element.scrollLeft = (anchor.scrollLeft + anchor.clientX) * anchor.ratio - anchor.clientX
    element.scrollTop = (anchor.scrollTop + anchor.clientY) * anchor.ratio - anchor.clientY
    pendingAnchor.current = null
  }, [zoom])

  useEffect(() => {
    const element = viewportRef.current
    if (!element || !wheelZoom) return
    const onWheel = (event: WheelEvent) => {
      if (!natural) return
      event.preventDefault()
      const direction = event.deltaY < 0 ? 1 : -1
      const factor = 1.13
      applyZoom(zoom * (direction > 0 ? factor : 1 / factor), event.clientX, event.clientY)
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [applyZoom, natural, wheelZoom, zoom])

  const actualSizeZoom = fitScale > 0 ? clampZoom(1 / fitScale) : 1

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'touch') return
    if (event.button !== 0 || zoom <= 1) return
    const element = viewportRef.current
    if (!element) return
    element.setPointerCapture(event.pointerId)
    dragState.current = {
      x: event.clientX,
      y: event.clientY,
      left: element.scrollLeft,
      top: element.scrollTop,
    }
    setDragging(true)
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = viewportRef.current
    const state = dragState.current
    if (!element || !state) return
    element.scrollLeft = state.left - (event.clientX - state.x)
    element.scrollTop = state.top - (event.clientY - state.y)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const element = viewportRef.current
    if (element?.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
    dragState.current = null
    setDragging(false)
  }

  return (
    <div
      className="relative h-full min-h-0 w-full overflow-hidden"
      role="group"
      aria-label="Schematic image viewer"
    >
      <div
        ref={viewportRef}
        className="image-viewport h-full w-full"
        data-zoomed={zoom > 1}
        data-dragging={dragging}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {status === 'error' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#0b0e13] text-center">
            <ImageOff size={26} className="text-smoke" />
            <p className="text-[13px] font-medium text-ash">This image could not be loaded.</p>
            <p className="max-w-xs text-[11.5px] leading-relaxed text-smoke">
              Check that the original file still exists in the collection folder, then rebuild the
              manifest.
            </p>
          </div>
        ) : (
          <div
            className="flex items-center justify-center"
            style={{
              width: natural ? Math.max(displayWidth + 24, viewport.width) : viewport.width,
              height: natural ? Math.max(displayHeight + 24, viewport.height) : viewport.height,
            }}
          >
            <img
              src={src}
              alt={alt}
              draggable={false}
              onLoad={(event) => {
                const image = event.currentTarget
                setNatural({ width: image.naturalWidth, height: image.naturalHeight })
                setStatus('loaded')
              }}
              onError={() => setStatus('error')}
              className={cn(
                'block max-w-none select-none object-contain transition-opacity duration-200',
                status === 'loaded' ? 'opacity-100' : 'opacity-0',
              )}
              style={
                natural
                  ? { width: displayWidth, height: displayHeight }
                  : { width: 1, height: 1 }
              }
            />
          </div>
        )}

        {status === 'loading' ? <div className="skeleton" aria-hidden="true" /> : null}
      </div>

      {status === 'loaded' ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-3">
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-lg border border-white/[0.12] bg-[#080a0f]/88 p-1 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
            <Tooltip label="Zoom out" side="top">
              <button
                type="button"
                onClick={() => applyZoom(zoom - 0.25)}
                disabled={zoom <= MIN_ZOOM}
                aria-label="Zoom out"
                className="flex h-9 w-9 items-center justify-center rounded-md text-ash transition hover:bg-white/[0.07] hover:text-bone disabled:opacity-35"
              >
                <Minus size={16} />
              </button>
            </Tooltip>

            <span
              className="min-w-[52px] text-center text-[11px] font-semibold tabular-nums text-bone"
              aria-live="polite"
              aria-label={`Zoom ${Math.round(zoom * 100)} percent`}
            >
              {Math.round(zoom * 100)}%
            </span>

            <Tooltip label="Zoom in" side="top">
              <button
                type="button"
                onClick={() => applyZoom(zoom + 0.25)}
                disabled={zoom >= MAX_ZOOM}
                aria-label="Zoom in"
                className="flex h-9 w-9 items-center justify-center rounded-md text-ash transition hover:bg-white/[0.07] hover:text-bone disabled:opacity-35"
              >
                <Plus size={16} />
              </button>
            </Tooltip>

            <span className="mx-1 h-5 w-px bg-white/[0.1]" />

            <Tooltip label="Fit to screen" side="top">
              <button
                type="button"
                onClick={() => applyZoom(1)}
                disabled={zoom === 1}
                aria-label="Fit image to screen"
                className="flex h-9 w-9 items-center justify-center rounded-md text-ash transition hover:bg-white/[0.07] hover:text-bone disabled:opacity-35"
              >
                <Maximize2 size={15} />
              </button>
            </Tooltip>

            <Tooltip label="Actual size (1:1)" side="top">
              <button
                type="button"
                onClick={() => applyZoom(actualSizeZoom)}
                className="flex h-9 items-center justify-center rounded-md px-2 text-[10.5px] font-semibold text-ash transition hover:bg-white/[0.07] hover:text-bone"
                aria-label="Actual size, one image pixel per screen pixel"
              >
                1:1
              </button>
            </Tooltip>
          </div>
        </div>
      ) : null}

      {status === 'loaded' && natural ? (
        <div className="pointer-events-none absolute bottom-3 left-3 hidden rounded-md border border-white/[0.07] bg-black/45 px-2 py-1 text-[9.5px] text-smoke backdrop-blur-sm lg:block">
          {natural.width} × {natural.height}
          {wheelZoom ? ' · Scroll to zoom · Drag to pan' : ' · Drag to pan'}
        </div>
      ) : null}
    </div>
  )
}
