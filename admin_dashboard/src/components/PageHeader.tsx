type PageHeaderProps = {
  title: string
  description: string
}

function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-primary text-[52px] leading-[0.95] font-semibold text-green">{title}</h1>
      <p className="text-base leading-[1.55] text-ink">{description}</p>
    </header>
  )
}

export default PageHeader
