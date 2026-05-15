import React from "react"

function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\))/g
  let lastIdx = 0
  let idx = 0
  let match: RegExpExecArray | null

  pattern.lastIndex = 0
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push(text.slice(lastIdx, match.index))
    if (match[2]) parts.push(<strong key={idx}><em>{match[2]}</em></strong>)
    else if (match[3]) parts.push(<strong key={idx}>{match[3]}</strong>)
    else if (match[4]) parts.push(<em key={idx}>{match[4]}</em>)
    else if (match[5] && match[6]) {
      parts.push(
        <a
          key={idx}
          href={match[6]}
          className="text-[#311e86] underline hover:text-[#1e3a5f] transition-colors"
        >
          {match[5]}
        </a>
      )
    }
    lastIdx = match.index + match[0].length
    idx++
  }
  if (lastIdx < text.length) parts.push(text.slice(lastIdx))
  return parts.length === 1 ? parts[0] : <>{parts}</>
}

export function BlogContent({ content }: { content: string }) {
  if (!content) return null

  const lines = content.split("\n")
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  function flushList() {
    if (listItems.length === 0) return
    elements.push(
      <div key={key++} className="space-y-3 my-4">
        {listItems.map((item, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="mt-1.5 w-2 h-2 rounded-full bg-[#f75d20] shrink-0" />
            <p className="text-gray-700 leading-relaxed">{renderInline(item)}</p>
          </div>
        ))}
      </div>
    )
    listItems = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (/^[-*+]\s/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-*+]\s/, ""))
      continue
    }
    flushList()

    if (!trimmed) continue

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={key++} className="text-xl font-serif text-[#1e3a5f] mt-8 mb-3">
          {renderInline(trimmed.slice(4))}
        </h3>
      )
      continue
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="text-2xl font-serif text-[#1e3a5f] mt-10 mb-4">
          {renderInline(trimmed.slice(3))}
        </h2>
      )
      continue
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={key++} className="text-2xl font-serif text-[#1e3a5f] mt-10 mb-4">
          {renderInline(trimmed.slice(2))}
        </h2>
      )
      continue
    }

    if (trimmed.startsWith("> ")) {
      elements.push(
        <blockquote
          key={key++}
          className="border-l-4 border-[#311e86]/30 pl-5 py-2 my-6 text-gray-600 italic text-lg"
        >
          {renderInline(trimmed.slice(2))}
        </blockquote>
      )
      continue
    }

    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(<hr key={key++} className="my-8 border-gray-200" />)
      continue
    }

    elements.push(
      <p key={key++} className="text-gray-700 leading-relaxed">
        {renderInline(trimmed)}
      </p>
    )
  }
  flushList()

  return <div className="space-y-4">{elements}</div>
}
