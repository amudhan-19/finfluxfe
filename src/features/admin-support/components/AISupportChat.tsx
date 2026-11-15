// @author  veera
// @file    features/admin-support/components/AISupportChat.tsx

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, X } from 'lucide-react'
import * as supportApi from '@/features/admin-support/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { TypewriterText } from '@/features/admin-support/components/TypewriterText'
import { TypingIndicator } from '@/features/admin-support/components/TypingIndicator'
import { useUiStore } from '@/store/useUiStore'

type ChatMsg = {
  from: 'bot' | 'user'
  text: string
  animate?: boolean
}

export type AISupportChatProps = {
  variant?: 'embedded' | 'popup'
  onClose?: () => void
}

export function AISupportChat({ variant = 'embedded', onClose }: AISupportChatProps) {
  const { toast } = useUiStore()
  const [chat, setChat] = useState<ChatMsg[]>([
    {
      from: 'bot',
      text: "Hi! I'm T-Flux AI Support. Ask me about ERP integration, ontology mapping, users, roles, or workflows.",
    },
  ])
  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement | null>(null)

  const sendMut = useMutation({
    mutationFn: (message: string) => supportApi.postAiSupportChat(message),
    onMutate: (message) => {
      setChat((c) => [...c, { from: 'user', text: message }])
      setInput('')
    },
    onSuccess: (data) => {
      setChat((c) => [...c, { from: 'bot', text: data.reply, animate: true }])
    },
    onError: (e: unknown) => {
      const msg = getApiErrorMessage(e, 'Could not reach AI support.')
      toast(msg)
      setChat((c) => [...c, { from: 'bot', text: msg, animate: true }])
    },
  })

  const clearAnimate = (index: number) => {
    setChat((c) =>
      c.map((msg, i) => (i === index ? { ...msg, animate: false } : msg)),
    )
  }

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, sendMut.isPending])

  const send = (e: FormEvent) => {
    e.preventDefault()
    const q = input.trim()
    if (!q || sendMut.isPending) return
    sendMut.mutate(q)
  }

  const rootClass = ['ai-chat', variant === 'popup' ? 'ai-chat--popup' : 'ai-chat--embedded']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={rootClass}>
      <div className="ai-chat__header">
        <span className="ai-chat__header-icon" aria-hidden>
          <Sparkles size={18} strokeWidth={2} />
        </span>
        <div className="ai-chat__header-text">
          <div className="ai-chat__title" id="ai-support-title">AI Support</div>
          <div className="ai-chat__subtitle">Ask about ERP, ontology, users, workflows…</div>
        </div>
        <span className="ai-chat__badge">ONLINE</span>
        {onClose ? (
          <button
            type="button"
            className="ai-chat__close"
            onClick={onClose}
            aria-label="Close AI support"
          >
            <X size={18} strokeWidth={2} />
          </button>
        ) : null}
      </div>

      <div className="ai-chat__messages">
        {chat.map((m, i) => (
          <div
            key={`${i}-${m.from}-${m.text.slice(0, 12)}`}
            className={[
              'ai-chat__bubble',
              m.from === 'user' ? 'ai-chat__bubble--user' : 'ai-chat__bubble--bot',
            ].join(' ')}
          >
            {m.from === 'bot' && i === 0 ? (
              <span className="ai-chat__bubble-label">T-Flux AI Support</span>
            ) : null}
            {m.from === 'bot' && m.animate ? (
              <TypewriterText
                text={m.text}
                onComplete={() => clearAnimate(i)}
              />
            ) : (
              m.text
            )}
          </div>
        ))}
        {sendMut.isPending ? (
          <div className="ai-chat__bubble ai-chat__bubble--bot ai-chat__bubble--typing">
            <TypingIndicator />
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form className="ai-chat__composer" onSubmit={send}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a question…"
          className="ai-chat__input"
          disabled={sendMut.isPending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sendMut.isPending}
          className="ai-chat__send"
        >
          Send
        </button>
      </form>
    </div>
  )
}
