import { FolderPlus, HardDrive, RefreshCw, ScanLine } from 'lucide-react'
import { Button } from '../ui/Button'
import { Logo } from '../layout/Logo'

export function WelcomeScreen({ onReload }: { onReload: () => void }) {
  return (
    <section className="mx-auto max-w-4xl py-8 sm:py-14" aria-labelledby="welcome-title">
      <div className="vault-panel relative overflow-hidden px-5 py-10 text-center sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.07] blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
        />

        <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-gold/[0.07] text-gold">
          <Logo className="h-9 w-9" />
        </div>

        <span className="eyebrow relative mt-6 block">Local schematic archive</span>
        <h1
          id="welcome-title"
          className="display-title relative mx-auto mt-2 max-w-2xl text-[42px] leading-[0.95] text-bone sm:text-[56px]"
        >
          Your vault is waiting.
        </h1>
        <p className="relative mx-auto mt-4 max-w-xl text-[13.5px] leading-relaxed text-ash">
          Add screenshots of your traps, melee weapons, and guns. The vault indexes the filenames,
          builds fast previews, and keeps all of your organization data in this browser.
        </p>

        <div className="relative mx-auto mt-7 max-w-md text-left">
          <div className="rounded-xl border border-white/[0.08] bg-black/30 px-4 py-3.5 font-mono text-[11.5px] leading-relaxed text-ash">
            <p className="text-smoke">public/schematics/</p>
            <p className="pl-4">
              <span className="text-gold">traps/</span>
            </p>
            <p className="pl-4">
              <span className="text-teal">melee/</span>
            </p>
            <p className="pl-4">
              <span className="text-guns">guns/</span>
            </p>
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap justify-center gap-2">
          <Button variant="primary" onClick={onReload} className="gap-2">
            <RefreshCw size={15} />
            Reload vault
          </Button>
        </div>

        <p className="relative mx-auto mt-3 max-w-md text-[11.5px] leading-relaxed text-smoke">
          Run <code className="text-ash">npm run manifest</code> after adding files, or keep{' '}
          <code className="text-ash">npm run dev</code> running to rebuild automatically.
        </p>
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <FolderPlus size={17} />,
            title: 'Drop in screenshots',
            text: 'Use the traps, melee, or guns folder. PNG, JPG, JPEG, and WebP are supported.',
          },
          {
            icon: <ScanLine size={17} />,
            title: 'Open and inspect',
            text: 'Browse by category and open any full-resolution capture with pan and zoom.',
          },
          {
            icon: <HardDrive size={17} />,
            title: 'Keep your notes',
            text: 'Any details you add stay in this browser and are never written to the image files.',
          },
        ].map((step, index) => (
          <li key={step.title} className="vault-panel-subtle flex gap-3 p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gold/20 bg-gold/[0.06] text-gold">
              {step.icon}
            </span>
            <div>
              <p className="text-[12.5px] font-semibold text-bone">
                <span className="mr-1.5 text-[10px] tabular-nums text-smoke">0{index + 1}</span>
                {step.title}
              </p>
              <p className="mt-1 text-[11.5px] leading-relaxed text-smoke">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
