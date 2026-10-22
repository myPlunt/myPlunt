type PageHeaderProps = {
  title: string
}

function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-2">
      <h1 className="font-primary text-[52px] leading-[0.95] font-semibold text-green">{title}</h1>
    </header>
  )
}

export default PageHeader
