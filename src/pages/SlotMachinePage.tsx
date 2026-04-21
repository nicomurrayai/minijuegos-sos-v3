import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Link } from 'react-router-dom'

type SlotSymbolId =
  | 'salud-bienestar'
  | 'hogar'
  | 'movilidad'
  | 'multiasistencia'

type SlotSymbol = {
  id: SlotSymbolId
  alt: string
  imageSrc: string
  labelLines: string[]
}

type SpinOutcome = 'idle' | 'win' | 'lose'

type ResultPopup = {
  body: string
  title: string
  tone: Exclude<SpinOutcome, 'idle'>
}

type ReelState = {
  durationMs: number
  offset: number
  strip: SlotSymbolId[]
  visibleSymbolId: SlotSymbolId
}

const slotSymbols: SlotSymbol[] = [
  {
    id: 'salud-bienestar',
    alt: 'Icono Salud y Bienestar',
    imageSrc: '/slot-salud-bienestar.png',
    labelLines: ['Salud y', 'Bienestar'],
  },
  {
    id: 'hogar',
    alt: 'Icono Hogar',
    imageSrc: '/slot-hogar.png',
    labelLines: ['Hogar'],
  },
  {
    id: 'movilidad',
    alt: 'Icono Movilidad',
    imageSrc: '/slot-movilidad.png',
    labelLines: ['Movilidad'],
  },
  {
    id: 'multiasistencia',
    alt: 'Icono Multiasistencia',
    imageSrc: '/slot-multiasistencia.png',
    labelLines: ['Multiasistencia'],
  },
]

const slotSymbolIds = slotSymbols.map((symbol) => symbol.id)

const slotSymbolsById = Object.fromEntries(
  slotSymbols.map((symbol) => [symbol.id, symbol]),
) as Record<SlotSymbolId, SlotSymbol>

const initialVisibleSymbols: SlotSymbolId[] = [
  'multiasistencia',
  'salud-bienestar',
  'hogar',
]

const baseSpinDurationMs = 2360
const reelStaggerMs = 320

function createIdleReel(symbolId: SlotSymbolId): ReelState {
  return {
    durationMs: 0,
    offset: 0,
    strip: [symbolId],
    visibleSymbolId: symbolId,
  }
}

function randomSymbolId(): SlotSymbolId {
  const index = Math.floor(Math.random() * slotSymbolIds.length)
  return slotSymbolIds[index]
}

function buildSpinStrip(
  currentSymbolId: SlotSymbolId,
  finalSymbolId: SlotSymbolId,
  reelIndex: number,
): SlotSymbolId[] {
  const strip: SlotSymbolId[] = [currentSymbolId]
  const steps = 17 + reelIndex * 4 + Math.floor(Math.random() * 4)
  let pointer = Math.floor(Math.random() * slotSymbolIds.length)

  for (let step = 0; step < steps; step += 1) {
    strip.push(slotSymbolIds[pointer])
    pointer = (pointer + 1) % slotSymbolIds.length
  }

  strip.push(finalSymbolId)

  return strip
}

function SlotMachinePage() {
  const [reels, setReels] = useState<ReelState[]>(() =>
    initialVisibleSymbols.map(createIdleReel),
  )
  const [isSpinning, setIsSpinning] = useState(false)
  const [lastOutcome, setLastOutcome] = useState<SpinOutcome>('idle')
  const [resultPopup, setResultPopup] = useState<ResultPopup | null>(null)
  const [resultMessage, setResultMessage] = useState(
    'Tirá de la palanca para empezar.',
  )
  const timeoutsRef = useRef<number[]>([])
  const frameRef = useRef<number | null>(null)
  const spinningRef = useRef(false)

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!resultPopup) {
      return
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setResultPopup(null)
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [resultPopup])

  function clearScheduledWork() {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    timeoutsRef.current = []

    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }
  }

  function handleSpin() {
    if (spinningRef.current) {
      return
    }

    clearScheduledWork()

    const finalSymbols = Array.from({ length: reels.length }, () =>
      randomSymbolId(),
    )
    const preparedReels = reels.map((reel, reelIndex) => ({
      durationMs: 0,
      offset: 0,
      strip: buildSpinStrip(
        reel.visibleSymbolId,
        finalSymbols[reelIndex],
        reelIndex,
      ),
      visibleSymbolId: reel.visibleSymbolId,
    }))

    spinningRef.current = true
    setIsSpinning(true)
    setLastOutcome('idle')
    setResultPopup(null)
    setResultMessage('Girando...')
    setReels(preparedReels)

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null

      setReels((currentReels) =>
        currentReels.map((reel, reelIndex) => ({
          ...reel,
          durationMs: baseSpinDurationMs + reelIndex * reelStaggerMs,
          offset: reel.strip.length - 1,
        })),
      )
    })

    const settleDelay =
      baseSpinDurationMs + (reels.length - 1) * reelStaggerMs + 140

    const settleId = window.setTimeout(() => {
      const didWin = finalSymbols.every(
        (symbolId) => symbolId === finalSymbols[0],
      )

      spinningRef.current = false
      setIsSpinning(false)
      setLastOutcome(didWin ? 'win' : 'lose')
      setResultMessage(
        didWin
          ? 'Premio SOS. Salieron tres iguales.'
          : 'No hubo premio. Probá otra vez.',
      )
      setResultPopup({
        body: didWin
          ? 'La tirada termino con un resultado ganador.'
          : 'La tirada termino sin premio en esta ocasion.',
        title: 'Resultado',
        tone: didWin ? 'win' : 'lose',
      })
      setReels(finalSymbols.map(createIdleReel))
    }, settleDelay)

    timeoutsRef.current.push(settleId)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#252423] px-5 py-7 text-[#efe5d7] sm:px-7 lg:px-10 lg:py-10">
      <div
        className="absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 18%, rgba(255, 99, 56, 0.08), transparent 26%), radial-gradient(circle at 50% 70%, rgba(255, 255, 255, 0.03), transparent 42%), linear-gradient(180deg, rgba(255, 255, 255, 0.015), rgba(0, 0, 0, 0.12))',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3.5rem)] w-full max-w-[1120px] flex-col items-center justify-center">
        <div className="mb-10 flex w-full">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-6 py-4 text-lg font-extrabold uppercase tracking-[0.08em] text-[#f0e2cb] transition-colors hover:border-white/20 hover:bg-white/4"
          >
            <span className="text-3xl leading-none">{'<'}</span>
            Volver
          </Link>
        </div>

        <header className="mb-5 text-center sm:mb-6">
          <h1
            className="text-[clamp(3rem,7vw,4.15rem)] font-black uppercase leading-none tracking-[0.05em] text-[#ff4d28]"
            style={{
              fontFamily:
                "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
            }}
          >
            Slot Machine
          </h1>
          <p
            className="mt-2 text-[clamp(1.05rem,2.2vw,1.4rem)] font-bold uppercase tracking-[0.03em] text-[#ab9d84]"
            style={{ fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}
          >
            Tirá de la palanca
          </p>
        </header>

        <div className="flex w-full flex-col items-center gap-5 sm:gap-6">
          <section className="flex w-full items-center justify-center gap-3 sm:gap-4">
            <div
              className={`relative w-[min(84vw,42rem)] rounded-[2.2rem] px-[clamp(0.85rem,2vw,1.2rem)] pb-[clamp(1rem,2vw,1.35rem)] pt-[clamp(1.55rem,3vw,2rem)] transition-shadow duration-300 ${
                lastOutcome === 'win'
                  ? 'shadow-[0_32px_90px_rgba(255,78,37,0.24)]'
                  : 'shadow-[0_28px_82px_rgba(0,0,0,0.44)]'
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-[clamp(1rem,2.5vw,1.45rem)] rounded-t-[2.2rem] bg-[#ff4d28]" />

              <div className="absolute inset-x-[3.5%] bottom-0 top-[0.8rem] rounded-[2.3rem] bg-[#2b2a28]" />

              <div className="relative rounded-[2rem] border border-black/60 bg-[#1f1e1d] px-[clamp(0.7rem,1.9vw,1rem)] py-[clamp(0.75rem,2vw,1rem)] shadow-[inset_0_4px_0_rgba(255,255,255,0.02),inset_0_-12px_24px_rgba(0,0,0,0.25)]">
                <div className="pointer-events-none absolute inset-y-4 left-[0.18rem] flex flex-col justify-between">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={`left-bolt-${index}`}
                      className="h-3.5 w-3.5 rounded-full border border-white/6 bg-[#2c2c2a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
                    />
                  ))}
                </div>

                <div className="pointer-events-none absolute inset-y-4 right-[0.18rem] flex flex-col justify-between">
                  {Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={`right-bolt-${index}`}
                      className="h-3.5 w-3.5 rounded-full border border-white/6 bg-[#2c2c2a] shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)]"
                    />
                  ))}
                </div>

                <div className="rounded-[1.75rem] border border-black/60 bg-[#262523] px-[clamp(1.2rem,2.8vw,1.8rem)] py-[clamp(1.05rem,2.8vw,1.55rem)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                  <div className="grid grid-cols-3 gap-[clamp(0.8rem,2vw,1.15rem)]">
                    {reels.map((reel, reelIndex) => {
                      const trackStyle = {
                        '--reel-duration': `${reel.durationMs}ms`,
                        '--reel-offset': reel.offset,
                      } as CSSProperties

                      return (
                        <div
                          key={`reel-${reelIndex}`}
                          className="relative h-[var(--slot-window-height)] overflow-hidden rounded-[1.3rem] border border-[#dad7d2] bg-[radial-gradient(circle_at_50%_30%,rgba(255,255,255,0.07),rgba(18,18,18,0.1)_55%,rgba(0,0,0,0.3)_100%)] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.05),0_14px_28px_rgba(0,0,0,0.3)]"
                        >
                          <div className="slot-reel-track" style={trackStyle}>
                            {reel.strip.map((symbolId, symbolIndex) => {
                              const symbol = slotSymbolsById[symbolId]

                              return (
                                <div
                                  key={`${symbolId}-${symbolIndex}`}
                                  className="flex h-[var(--slot-window-height)] flex-col items-center justify-center gap-5 px-4 py-6 sm:px-5"
                                >
                                  <img
                                    src={symbol.imageSrc}
                                    alt={symbol.alt}
                                    className="h-[clamp(4.9rem,11vw,6.6rem)] w-auto object-contain sm:h-[clamp(5.5rem,10vw,7.2rem)]"
                                    draggable="false"
                                  />

                                  <span
                                    className="flex min-h-[3.3rem] flex-col items-center justify-center text-center text-[clamp(0.95rem,2vw,1.55rem)] font-black leading-[1.02] text-[#f2e8d8]"
                                    style={{
                                      fontFamily:
                                        "'Trebuchet MS', 'Gill Sans', sans-serif",
                                      textShadow:
                                        '0 2px 10px rgba(0, 0, 0, 0.45)',
                                    }}
                                  >
                                    {symbol.labelLines.map((line) => (
                                      <span key={line}>{line}</span>
                                    ))}
                                  </span>
                                </div>
                              )
                            })}
                          </div>

                          <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/38 via-black/8 to-transparent" />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-6">
              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                aria-label="Girar slot machine con la palanca"
                className="group relative flex h-[12rem] w-[4.6rem] items-end justify-center overflow-visible rounded-full bg-transparent outline-none transition-transform duration-200 hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:ring-2 focus-visible:ring-[#ff6d3f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#252423] disabled:cursor-not-allowed disabled:opacity-90 sm:h-[12.7rem] sm:w-[4.9rem]"
              >
                <span
                  data-animating={isSpinning ? 'true' : 'false'}
                  className="slot-machine-lever absolute bottom-4 left-1/2 h-[9.5rem] w-[3.8rem]"
                >
                  <span className="absolute bottom-0 left-1/2 h-[7.25rem] w-[0.78rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#fbfdff] via-[#eceef6] to-[#bac0cf] shadow-[0_0_0_1px_rgba(255,255,255,0.24),0_0_18px_rgba(255,255,255,0.18)]" />
                  <span
                    className="absolute left-1/2 top-0 h-[2.25rem] w-[2.25rem] -translate-x-1/2 rounded-full bg-[#ff612d] shadow-[0_12px_26px_rgba(255,78,37,0.38),inset_0_2px_3px_rgba(255,255,255,0.32)]"
                  />
                </span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-2.5 left-1/2 h-[1rem] w-[1rem] -translate-x-1/2 rounded-full bg-[#bcc5d4] shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_18px_rgba(0,0,0,0.22)]"
                />
              </button>

              <button
                type="button"
                onClick={handleSpin}
                disabled={isSpinning}
                aria-label="Girar slot machine con el boton lateral"
                className="relative h-[2.7rem] w-[2.7rem] rounded-full bg-[#6f788b] shadow-[0_0_0_3px_rgba(189,197,212,0.22),0_12px_24px_rgba(0,0,0,0.3)] transition-transform duration-200 hover:scale-[1.04] focus-visible:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c7d1e3] focus-visible:ring-offset-4 focus-visible:ring-offset-[#252423] disabled:cursor-not-allowed disabled:opacity-70 sm:h-[2.95rem] sm:w-[2.95rem]"
              >
                <span className="absolute inset-[0.78rem] rounded-full bg-[#414957] shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] sm:inset-[0.86rem]" />
              </button>
            </div>
          </section>

          <div className="flex min-h-[3.5rem] items-center justify-center px-2">
            <p
              aria-live="polite"
              data-tone={lastOutcome}
              className={`slot-machine-message text-center text-[clamp(1rem,2.2vw,1.32rem)] font-bold tracking-[0.01em] ${
                lastOutcome === 'win'
                  ? 'text-[#ffb78d]'
                  : lastOutcome === 'lose'
                    ? 'text-[#e5dccc]'
                    : 'text-[#b7ad9b]'
              }`}
              style={{ fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}
            >
              {resultMessage}
            </p>
          </div>
        </div>
      </div>

      {resultPopup ? (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center bg-black/58 px-5 backdrop-blur-[3px]"
          onClick={() => setResultPopup(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="slot-result-title"
            className={`w-full max-w-[23rem] rounded-[1.8rem] border px-6 py-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.44)] sm:px-7 sm:py-7 ${
              resultPopup.tone === 'win'
                ? 'border-[#ff8057]/60 bg-[#2d211c] text-[#ffe2d4]'
                : 'border-white/12 bg-[#2b2a28] text-[#f0e7d8]'
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="mb-3 inline-flex rounded-full bg-white/6 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[#c7b9a0]">
              Slot Machine
            </span>
            <h2
              id="slot-result-title"
              className={`text-[1.8rem] font-black uppercase tracking-[0.04em] ${
                resultPopup.tone === 'win'
                  ? 'text-[#ff8b5c]'
                  : 'text-[#f1e5d2]'
              }`}
              style={{
                fontFamily:
                  "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif",
              }}
            >
              {resultPopup.title}
            </h2>
            <p
              className="mt-3 text-[1rem] font-medium leading-6 text-inherit/90"
              style={{ fontFamily: "'Trebuchet MS', 'Gill Sans', sans-serif" }}
            >
              {resultPopup.body}
            </p>
            <button
              type="button"
              onClick={() => setResultPopup(null)}
              className="mt-6 inline-flex h-[3rem] min-w-[9rem] items-center justify-center rounded-full bg-[#ff5a31] px-5 text-[0.95rem] font-black uppercase tracking-[0.06em] text-white shadow-[0_12px_24px_rgba(255,90,49,0.26)] transition-transform duration-200 hover:scale-[1.02] focus-visible:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8f6f] focus-visible:ring-offset-4 focus-visible:ring-offset-[#252423]"
            >
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default SlotMachinePage
