import type { ReactNode } from 'react'

type CardProps = {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}

function Card({ title, subtitle, children, className = '' }: CardProps) {
  return (
    <section className={`flex flex-col gap-4 rounded-3xl bg-cream p-5 shadow-card sm:p-6 ${className}`}>
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-green">{title}</h2>
        {subtitle && <p className="text-sm text-ink">{subtitle}</p>}
      </header>
      {children}
    </section>
  )
}

export default Card
