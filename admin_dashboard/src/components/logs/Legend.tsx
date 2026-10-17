function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-ink">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          {/* style: the color is a CSS variable picked per item, which a class can't express. */}
          <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export default Legend
