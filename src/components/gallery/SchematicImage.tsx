import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '../../lib/cn'

type Status = 'loading' | 'loaded' | 'error'

export function SchematicImage({
  src,
  fallbackSrc,
  alt,
  className,
  imageClassName,
  eager = false,
}: {
  src: string
  fallbackSrc?: string | null
  alt: string
  className?: string
  imageClassName?: string
  eager?: boolean
}) {
  const [resolvedSrc, setResolvedSrc] = useState(src)
  const [status, setStatus] = useState<Status>('loading')
  const [triedFallback, setTriedFallback] = useState(false)

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <img
        src={resolvedSrc}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        onLoad={() => setStatus('loaded')}
        onError={() => {
          if (!triedFallback && fallbackSrc && resolvedSrc !== fallbackSrc) {
            setTriedFallback(true)
            setResolvedSrc(fallbackSrc)
            setStatus('loading')
          } else {
            setStatus('error')
          }
        }}
        className={cn(
          'schematic-image transition-opacity duration-200',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          imageClassName,
        )}
      />

      {status === 'loading' ? <div className="skeleton" aria-hidden="true" /> : null}

      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-[#0b0e13] px-3 text-center">
          <ImageOff size={18} className="text-smoke" aria-hidden="true" />
          <span className="text-[10.5px] font-medium text-smoke">Preview unavailable</span>
          <span className="sr-only">Could not load {alt}</span>
        </div>
      ) : null}
    </div>
  )
}
