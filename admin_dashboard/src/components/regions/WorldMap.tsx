import { type ReactNode, useEffect, useRef, useState } from 'react'

import worldDots from '../../assets/world-dots.json'
import worldMap from '../../assets/world-map.json'
import { regionColor, type Region } from '../../lib/regions'

// The coordinate space world-map.json was projected into.
const WIDTH = 960
const HEIGHT = 419
// Past this the simplified borders look blocky; the tiniest countries are dots anyway.
const MAX_ZOOM = 20
const FULL_VIEW = { x: 0, y: 0, width: WIDTH }
// Countries too small to hover (Vatican, Monaco, small islands) also get an invisible hover area at their centre.
const dots: Record<string, number[]> = worldDots
const shapes: Record<string, string> = worldMap

type View = typeof FULL_VIEW

// Keeps the view inside the map.
function clamp({ x, y, width }: View): View {
  const height = (width * HEIGHT) / WIDTH
  return {
    width,
    x: Math.min(WIDTH - width, Math.max(0, x)),
    y: Math.min(HEIGHT - height, Math.max(0, y)),
  }
}

// fx and fy: the point that stays in place, as fractions of the visible map (0.5 = centre).
function zoomAt(view: View, factor: number, fx = 0.5, fy = 0.5): View {
  const width = Math.min(WIDTH, Math.max(WIDTH / MAX_ZOOM, view.width * factor))
  const shift = view.width - width
  return clamp({
    width,
    x: view.x + fx * shift,
    y: view.y + (fy * shift * HEIGHT) / WIDTH,
  })
}

type WorldMapProps = {
  regions: Region[]
  // The countries to colour; the others fade.
  shown: Set<string>
  // Shown on the left of the zoom buttons (the page's search box).
  children: ReactNode
}

function WorldMap({ regions, shown, children }: WorldMapProps) {
  const [view, setView] = useState(FULL_VIEW)
  const [hovered, setHovered] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const drag = useRef<{ clientX: number; clientY: number; view: View } | null>(null)
  const zoom = WIDTH / view.width

  // A native listener: React's wheel listener is passive, so it can't stop the page from scrolling.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = svg.getBoundingClientRect()
      const fx = (event.clientX - rect.left) / rect.width
      const fy = (event.clientY - rect.top) / rect.height
      setView((current) => zoomAt(current, Math.exp(event.deltaY * 0.002), fx, fy))
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [])

  const buttonClass =
    'flex h-9 min-w-9 items-center justify-center rounded-full border border-green bg-cream px-3 text-sm font-semibold text-green transition-opacity hover:opacity-80 disabled:opacity-50'

  return (
    <>
      <div className="flex items-center gap-3">
        {children}
        <div className="ml-auto flex shrink-0 gap-2">
          <button
            type="button"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={() => setView(zoomAt(view, 0.5))}
            className={buttonClass}
          >
            +
          </button>
          <button
            type="button"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => setView(zoomAt(view, 2))}
            className={buttonClass}
          >
            −
          </button>
          <button type="button" disabled={zoom <= 1} onClick={() => setView(FULL_VIEW)} className={buttonClass}>
            Reset
          </button>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.width} ${(view.width * HEIGHT) / WIDTH}`}
          role="img"
          aria-label="World map coloured by region. Scroll to zoom, drag to move."
          className="w-full cursor-grab touch-none active:cursor-grabbing"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = {
              clientX: event.clientX,
              clientY: event.clientY,
              view,
            }
          }}
          onPointerMove={(event) => {
            const start = drag.current
            if (!start) return
            const scale = start.view.width / event.currentTarget.getBoundingClientRect().width
            setView(
              clamp({
                width: start.view.width,
                x: start.view.x - (event.clientX - start.clientX) * scale,
                y: start.view.y - (event.clientY - start.clientY) * scale,
              }),
            )
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onPointerOver={(event) => setHovered((event.target as Element).getAttribute('data-label'))}
          onPointerLeave={() => setHovered(null)}
        >
          {regions.flatMap((region) =>
            // A country the map has no shape for is skipped; the list below still names it.
            region.countries
              .filter((country) => country in shapes)
              .map((country) => (
                <path
                  key={country}
                  d={shapes[country]}
                  fill={regionColor(region)}
                  data-label={`${country} (${region.name})`}
                  vectorEffect="non-scaling-stroke"
                  strokeWidth={0.5}
                  className={`stroke-cream transition-opacity ${shown.has(country) ? '' : 'opacity-15'}`}
                >
                  <title>{`${country} (${region.name})`}</title>
                </path>
              )),
          )}
          {regions.flatMap((region) =>
            region.countries
              .filter((country) => country in dots)
              .map((country) => (
                <circle
                  key={country}
                  cx={dots[country][0]}
                  cy={dots[country][1]}
                  r={4 / zoom}
                  fill="transparent"
                  data-label={`${country} (${region.name})`}
                >
                  <title>{`${country} (${region.name})`}</title>
                </circle>
              )),
          )}
        </svg>

        {hovered && (
          <p className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white px-3 py-1 text-sm text-charcoal shadow-card">
            {hovered}
          </p>
        )}
      </div>
    </>
  )
}

export default WorldMap
