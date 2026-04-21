import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'
import SlotMachinePage from './pages/SlotMachinePage'

type GameCardProps = {
  title: string
  category: string
  to: string
}

function GameCard({ title, category, to }: GameCardProps) {
  return (
    <article className="flex w-full max-w-[400px] flex-col items-center">
      <span className="mb-2 text-[clamp(0.8rem,1.2vw,1.05rem)] font-semibold uppercase tracking-[0.32em] text-[#e6d7c0]">
        {category}
      </span>
      <h2 className="mb-5 text-center text-[clamp(2.4rem,4vw,4.6rem)] font-black uppercase leading-none tracking-tight text-[#f0e2cb]">
        {title}
      </h2>
      <Link
        to={to}
        className="flex h-[58px] w-full max-w-[240px] items-center justify-center rounded-full bg-gradient-to-b from-[#ff4a4a] via-[#ff1212] to-[#d60303] text-[1.3rem] font-black uppercase tracking-[0.08em] text-white shadow-[inset_0_2px_0_rgba(255,255,255,0.45),0_14px_26px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:scale-[1.02]"
      >
        Jugar
      </Link>
    </article>
  )
}

function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#252423] px-6 py-8 text-white">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-center gap-18">
        <header>
          <img
            src="/sos-logo-home.png"
            alt="SOS Red de Asistencia"
            className="mx-auto w-[min(36vw,250px)]"
          />
        </header>

        <section className="flex w-full flex-col items-center justify-center gap-14 md:flex-row md:items-end md:justify-center md:gap-20">
          <GameCard title="Simon" category="Memoria" to="/simon" />
          <GameCard title="Slot Machine" category="Azar" to="/slotmachine" />
        </section>
      </div>
    </main>
  )
}

type SimonTileId = 'red' | 'yellow' | 'blue' | 'green'

type SimonTile = {
  id: SimonTileId
  label: string
  icon: string
  alt: string
  baseColor: string
  activeColor: string
  shadowColor: string
  shapeClassName: string
}

const simonTiles: SimonTile[] = [
  {
    id: 'red',
    label: 'Multiasistencia',
    icon: '/simon-icono-1.png',
    alt: 'Icono Multiasistencia',
    baseColor: '#ff1f1f',
    activeColor: '#ff6767',
    shadowColor: 'rgba(255, 60, 60, 0.48)',
    shapeClassName:
      'rounded-tl-[999px] rounded-tr-[44px] rounded-br-[38px] rounded-bl-[44px]',
  },
  {
    id: 'yellow',
    label: 'Movilidad',
    icon: '/simon-icono-2.png',
    alt: 'Icono Movilidad',
    baseColor: '#f8c10d',
    activeColor: '#ffd85d',
    shadowColor: 'rgba(255, 212, 90, 0.42)',
    shapeClassName:
      'rounded-tl-[44px] rounded-tr-[999px] rounded-br-[44px] rounded-bl-[38px]',
  },
  {
    id: 'blue',
    label: 'Hogar',
    icon: '/simon-icono-3.png',
    alt: 'Icono Hogar',
    baseColor: '#2f7ae7',
    activeColor: '#64a5ff',
    shadowColor: 'rgba(85, 154, 255, 0.42)',
    shapeClassName:
      'rounded-tl-[44px] rounded-tr-[38px] rounded-br-[44px] rounded-bl-[999px]',
  },
  {
    id: 'green',
    label: 'Salud y Bienestar',
    icon: '/simon-icono-4.png',
    alt: 'Icono Salud y Bienestar',
    baseColor: '#2ab761',
    activeColor: '#59d88b',
    shadowColor: 'rgba(70, 224, 130, 0.38)',
    shapeClassName:
      'rounded-tl-[38px] rounded-tr-[44px] rounded-br-[999px] rounded-bl-[44px]',
  },
]

function getRandomSimonTileId(): SimonTileId {
  const index = Math.floor(Math.random() * simonTiles.length)
  return simonTiles[index].id
}

function SimonPage() {
  const [score, setScore] = useState(0)
  const [sequence, setSequence] = useState<SimonTileId[]>([])
  const [playerInput, setPlayerInput] = useState<SimonTileId[]>([])
  const [activeTile, setActiveTile] = useState<SimonTileId | null>(null)
  const [isPlayingSequence, setIsPlayingSequence] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [message, setMessage] = useState(
    'Observa la secuencia y repetila en el mismo orden.',
  )
  const timeoutsRef = useRef<number[]>([])

  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    }
  }, [])

  function clearTimers() {
    timeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId))
    timeoutsRef.current = []
  }

  function flashTile(tileId: SimonTileId, delay = 0) {
    const startId = window.setTimeout(() => {
      setActiveTile(tileId)
    }, delay)

    const endId = window.setTimeout(() => {
      setActiveTile((current) => (current === tileId ? null : current))
    }, delay + 420)

    timeoutsRef.current.push(startId, endId)
  }

  function playSequence(nextSequence: SimonTileId[]) {
    clearTimers()
    setIsPlayingSequence(true)
    setPlayerInput([])
    setMessage('Mira atentamente la secuencia.')
    setActiveTile(null)

    nextSequence.forEach((tileId, index) => {
      flashTile(tileId, index * 700)
    })

    const finishId = window.setTimeout(() => {
      setIsPlayingSequence(false)
      setActiveTile(null)
      setMessage('Tu turno: repeti la secuencia.')
    }, nextSequence.length * 700 + 120)

    timeoutsRef.current.push(finishId)
  }

  function startRound(baseSequence?: SimonTileId[]) {
    const sourceSequence = baseSequence ?? []
    const nextSequence = [...sourceSequence, getRandomSimonTileId()]
    setSequence(nextSequence)
    playSequence(nextSequence)
  }

  function handleStart() {
    clearTimers()
    setScore(0)
    setHasStarted(true)
    startRound([])
  }

  function handleTileClick(tileId: SimonTileId) {
    if (!hasStarted || isPlayingSequence) {
      return
    }

    flashTile(tileId)

    const nextInput = [...playerInput, tileId]
    setPlayerInput(nextInput)

    const currentIndex = nextInput.length - 1
    const expectedTile = sequence[currentIndex]

    if (tileId !== expectedTile) {
      clearTimers()
      setActiveTile(null)
      setHasStarted(false)
      setIsPlayingSequence(false)
      setSequence([])
      setPlayerInput([])
      setScore(0)
      setMessage('Secuencia incorrecta. Presiona comenzar para reiniciar.')
      return
    }

    if (nextInput.length === sequence.length) {
      const nextScore = sequence.length
      setScore(nextScore)
      setMessage('Bien hecho. Preparando la siguiente secuencia...')

      const nextRoundId = window.setTimeout(() => {
        startRound(sequence)
      }, 900)

      timeoutsRef.current.push(nextRoundId)
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_72%_48%,rgba(255,255,255,0.03),transparent_24%),#252423] px-6 py-8 text-[#f0e2cb] lg:px-14 lg:py-11">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1450px] flex-col">
        <div className="mb-10 flex">
          <Link
            to="/"
            className="inline-flex items-center gap-3 rounded-full border border-white/10 px-6 py-4 text-lg font-extrabold uppercase tracking-[0.08em] text-[#f0e2cb] transition-colors hover:border-white/20 hover:bg-white/4"
          >
            <span className="text-3xl leading-none">{'<'}</span>
            Volver
          </Link>
        </div>

        <section className="flex flex-1 flex-col justify-center gap-12 md:gap-10 lg:flex-row lg:items-center lg:justify-between xl:gap-14">
          <div className="flex min-h-[520px] max-w-[480px] flex-col lg:max-w-[360px] xl:max-w-[480px]">
            <h1 className="mb-8 text-[clamp(3.2rem,5vw,5.8rem)] font-black uppercase leading-none tracking-tight text-[#ff4a2e] xl:mb-10">
              Simon
            </h1>

            <div className="mb-8 flex min-h-[170px] w-[320px] min-w-[320px] max-w-[320px] flex-col rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] px-6 py-5 shadow-[0_24px_80px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.05)] md:w-[355px] md:min-w-[355px] md:max-w-[355px] xl:mb-12 xl:min-h-[190px] xl:px-7 xl:py-6">
              <span className="text-[0.9rem] font-bold uppercase tracking-[0.18em] text-[#cabda7] xl:text-[1rem]">
                Secuencias Correctas
              </span>
              <div className="flex h-[96px] w-[180px] min-w-[180px] self-center items-center justify-center text-[4.4rem] font-black leading-none text-[#ff4a2e] tabular-nums md:h-[108px] md:w-[210px] md:min-w-[210px] md:text-[5rem] xl:h-[120px] xl:w-[230px] xl:min-w-[230px] xl:text-[5.5rem]">
                {score}
              </div>
            </div>

            <p className="mb-8 min-h-[84px] max-w-[340px] text-[0.95rem] font-medium uppercase leading-[1.4] text-[#dccaa9] md:max-w-[360px] xl:mb-12 xl:min-h-[92px] xl:text-[1.05rem]">
              {message}
            </p>

            <button
              type="button"
              onClick={handleStart}
              disabled={isPlayingSequence}
              className="mt-auto inline-flex h-[60px] min-w-[240px] items-center justify-center rounded-[1.35rem] bg-gradient-to-b from-[#ff4b3c] to-[#ff120d] px-8 text-[1rem] font-black uppercase tracking-[0.08em] text-white shadow-[0_18px_36px_rgba(255,40,20,0.26),inset_0_1px_0_rgba(255,255,255,0.28)] transition-transform duration-200 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-75 md:h-[64px] md:min-w-[255px] xl:h-[68px] xl:min-w-[275px] xl:px-10 xl:text-[1.1rem]"
            >
              {hasStarted ? 'Reiniciar' : 'Comenzar'}
            </button>
          </div>

          <div className="flex justify-center lg:flex-1 lg:justify-end">
            <div className="relative flex h-[min(68vw,460px)] w-[min(68vw,460px)] items-center justify-center rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-[4.8%] shadow-[0_35px_90px_rgba(0,0,0,0.38),inset_0_1px_0_rgba(255,255,255,0.05)] md:h-[min(52vw,500px)] md:w-[min(52vw,500px)] lg:h-[min(50vw,430px)] lg:w-[min(50vw,430px)] xl:h-[min(76vw,560px)] xl:w-[min(76vw,560px)]">
              <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-[4.5%] rounded-full bg-[#2f2e2c] p-[4.5%]">
                {simonTiles.map((tile) => {
                  const isActive = activeTile === tile.id

                  return (
                    <button
                      key={tile.id}
                      type="button"
                      onClick={() => handleTileClick(tile.id)}
                      disabled={!hasStarted || isPlayingSequence}
                      className={`flex h-full w-full items-center justify-center ${tile.shapeClassName} border-0 p-0 transition duration-200 ${!hasStarted || isPlayingSequence ? 'cursor-default' : 'cursor-pointer hover:brightness-105'}`}
                      style={{
                        background: isActive ? tile.activeColor : tile.baseColor,
                        boxShadow: isActive
                          ? `0 0 0 1px rgba(255,255,255,0.18), 0 0 42px ${tile.shadowColor}`
                          : 'none',
                      }}
                      aria-label={tile.label}
                    >
                      <div className="flex w-[38%] min-w-[58px] max-w-[90px] flex-col items-center justify-center md:min-w-[68px] md:max-w-[96px] xl:w-[40%] xl:min-w-[84px] xl:max-w-[118px]">
                        <img
                          src={tile.icon}
                          alt={tile.alt}
                          className="w-full object-contain"
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/simon" element={<SimonPage />} />
      <Route path="/slotmachine" element={<SlotMachinePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
