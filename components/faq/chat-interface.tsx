"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  "Hoe werkt een financieringsaanvraag?",
  "Wat zijn de voorwaarden voor een lening?",
  "Hoe kan ik investeren bij Lange & Partners?",
  "Wat is de looptijd van een non-bancaire lening?",
]

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: "user", content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput("")
    setIsLoading(true)

    // Placeholder voor streaming assistent-reactie
    const assistantPlaceholder: Message = { role: "assistant", content: "" }
    setMessages([...updatedMessages, assistantPlaceholder])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error("Netwerkfout")
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantText = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        assistantText += decoder.decode(value, { stream: true })
        setMessages([
          ...updatedMessages,
          { role: "assistant", content: assistantText },
        ])
      }
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Er is een fout opgetreden. Probeer het later opnieuw of neem contact met ons op via info@langefa.nl.",
        },
      ])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full text-center pt-8 pb-4">
            <div className="w-14 h-14 bg-[#311e86]/10 rounded-full flex items-center justify-center mb-5">
              <svg
                className="w-7 h-7 text-[#311e86]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            </div>
            <h2 className="text-[#1e3a5f] font-serif text-xl mb-2">
              Hoe kunnen we u helpen?
            </h2>
            <p className="text-gray-500 text-sm max-w-sm mb-8">
              Stel een vraag over onze diensten, financieringsopties of
              investeringsmogelijkheden.
            </p>

            {/* Suggested questions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-left px-4 py-3 rounded-2xl border border-gray-200 text-sm text-gray-700 hover:border-[#311e86] hover:text-[#311e86] hover:bg-[#311e86]/5 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-[#311e86] flex items-center justify-center text-white text-xs font-semibold mr-3 mt-0.5 shrink-0">
                  L
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-[#311e86] text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                }`}
              >
                {msg.content === "" && msg.role === "assistant" ? (
                  /* Typing indicator */
                  <span className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </span>
                ) : (
                  /* Preserve line breaks */
                  msg.content.split("\n").map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split("\n").length - 1 && <br />}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-4 py-4 bg-white">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Stel uw vraag..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-[#311e86] disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-[#311e86] text-white flex items-center justify-center hover:bg-[#261770] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            aria-label="Verstuur"
          >
            <Send size={16} />
          </button>
        </form>
        <p className="text-xs text-gray-400 mt-2 text-center">
          De assistent kan fouten maken. Bij complexe vragen kunt u altijd contact opnemen via{" "}
          <a href="mailto:info@langefa.nl" className="underline hover:text-[#311e86]">
            info@langefa.nl
          </a>
          .
        </p>
      </div>
    </div>
  )
}
