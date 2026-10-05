import CameraIcon from '../assets/icons/camera.svg?react'
import DropIcon from '../assets/icons/drop.svg?react'
import KeyIcon from '../assets/icons/key.svg?react'
import RainIcon from '../assets/icons/rain.svg?react'

const highlights = [
  { label: 'Watering reminders', Icon: DropIcon },
  { label: 'Weather alerts per plant', Icon: RainIcon },
  { label: 'A friend as backup', Icon: KeyIcon },
  { label: 'Show your progress', Icon: CameraIcon },
]

function HighlightsStrip() {
  return (
    <section className="bg-green">
      <ul className="mx-auto grid max-w-page grid-cols-1 gap-x-6 gap-y-4 py-7 px-page min-[480px]:grid-cols-2 lg:flex lg:items-center lg:justify-between">
        {highlights.map(({ label, Icon }) => (
          <li key={label} className="flex items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center text-sand">
              <Icon />
            </span>
            <span className="text-[17px] font-semibold whitespace-nowrap text-cream">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default HighlightsStrip
