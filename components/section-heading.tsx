interface SectionHeadingProps {
  children: React.ReactNode
  className?: string
}

export function SectionHeading({ children, className = "" }: SectionHeadingProps) {
  return (
    <div className={className}>
      <div className="w-16 h-1.5 bg-[#f75d20] mb-3" />
      <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#311e86]">{children}</h2>
    </div>
  )
}
