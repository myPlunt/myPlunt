type SectionHeaderProps = {
  eyebrow: string
  title: string
  subtitle?: string
  align?: 'center' | 'left'
}

function SectionHeader({ eyebrow, title, subtitle, align = 'center' }: SectionHeaderProps) {
  const alignment = align === 'center' ? 'items-center text-center' : 'items-start text-left'

  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      <p className="text-lg font-semibold text-leaf sm:text-xl">{eyebrow}</p>
      <h2 className="max-w-[920px] font-primary text-[44px] leading-[0.95] font-semibold sm:text-[62px]">{title}</h2>
      {subtitle && <p className="max-w-[680px] text-base leading-[1.55] text-ink sm:text-lg">{subtitle}</p>}
    </div>
  )
}

export default SectionHeader
