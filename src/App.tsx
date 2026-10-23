import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { SchematicCategory } from './types'
import { useVault } from './context/vault-context'
import { useMediaQuery } from './hooks/useMediaQuery'
import { viewScope } from './lib/search'
import { AppHeader } from './components/layout/AppHeader'
import { ViewTabs } from './components/layout/ViewTabs'
import { WelcomeScreen } from './components/overview/WelcomeScreen'
import { Gallery } from './components/gallery/Gallery'
import { SchematicDetail } from './components/schematic/SchematicDetail'

export default function App() {
  const {
    schematics,
    preferences,
    counts,
    startupWarning,
    startupWarnings,
    storageError,
    dismissStartupWarning,
  } = useVault()

  const [view, setView] = useState<SchematicCategory>('guns')
  const [detailId, setDetailId] = useState<string | null>(null)
  const systemReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const reducedMotion = preferences.reducedMotion || systemReducedMotion

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [reducedMotion])

  const visibleItems = useMemo(() => viewScope(schematics, view), [schematics, view])

  const detailItem = useMemo(
    () => (detailId ? schematics.find((item) => item.id === detailId) ?? null : null),
    [schematics, detailId],
  )
  const detailIndex = detailItem
    ? visibleItems.findIndex((item) => item.id === detailItem.id)
    : -1

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const selectView = (nextView: SchematicCategory) => {
    setView(nextView)
    scrollToTop()
  }

  const goHome = () => {
    setView('guns')
    window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  const closeDetail = () => {
    setDetailId(null)
  }

  const moveDetail = (direction: -1 | 1) => {
    if (detailIndex < 0) return
    const next = visibleItems[detailIndex + direction]
    if (next) setDetailId(next.id)
  }

  const notice =
    startupWarning ??
    storageError ??
    (startupWarnings.length > 0 ? startupWarnings.join(' ') : null)
  const hasImages = schematics.length > 0

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[110] focus:rounded-lg focus:border focus:border-gold/60 focus:bg-panel focus:px-4 focus:py-2 focus:text-[13px] focus:text-bone"
      >
        Skip to content
      </a>

      <div className="app-background min-h-screen">
        <AppHeader onHome={goHome} />

        {notice ? (
          <div className="border-b border-gold/20 bg-gold/[0.055]">
            <div className="mx-auto flex max-w-[1680px] items-start gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
              <p className="min-w-0 flex-1 text-[12px] leading-relaxed text-ash" role="alert">
                {notice}
              </p>
              {startupWarning ? (
                <button
                  type="button"
                  onClick={dismissStartupWarning}
                  aria-label="Dismiss storage notice"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-smoke transition hover:bg-white/[0.06] hover:text-bone"
                >
                  <X size={13} />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        <main id="main-content" className="mx-auto max-w-[1680px] px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          {!hasImages ? (
            <WelcomeScreen onReload={() => window.location.reload()} />
          ) : (
            <>
              <ViewTabs view={view} counts={counts} onSelect={selectView} />

              {visibleItems.length > 0 ? (
                <Gallery items={visibleItems} onOpen={setDetailId} />
              ) : (
                <p className="rounded-xl border border-dashed border-white/[0.11] px-5 py-12 text-center text-[13px] text-ash">
                  No schematics in this category yet.
                </p>
              )}
            </>
          )}
        </main>
      </div>

      {detailItem ? (
        <SchematicDetail
          item={detailItem}
          index={detailIndex}
          total={visibleItems.length}
          wheelZoom
          hasPrev={detailIndex > 0}
          hasNext={detailIndex >= 0 && detailIndex < visibleItems.length - 1}
          onClose={closeDetail}
          onPrev={() => moveDetail(-1)}
          onNext={() => moveDetail(1)}
        />
      ) : null}
    </>
  )
}
