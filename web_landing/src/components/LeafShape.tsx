const directions = {
  right: { shape: 'rounded-tr-full rounded-bl-full', vein: 'rotate-45' },
  left: { shape: 'rounded-tl-full rounded-br-full', vein: '-rotate-45' },
}

const tones = {
  sand: 'bg-sand',
  leaf: 'bg-leaf/20',
}

type LeafShapeProps = {
  direction?: keyof typeof directions
  tone?: keyof typeof tones
  className?: string
}

function LeafShape({ direction = 'right', tone = 'sand', className = '' }: LeafShapeProps) {
  const d = directions[direction]

  return (
    <div aria-hidden className={`overflow-hidden ${tones[tone]} ${d.shape} ${className}`}>
      <div className={`absolute top-1/2 left-1/2 h-[3px] w-[142%] -translate-1/2 bg-cream/70 ${d.vein}`} />
    </div>
  )
}

export default LeafShape
