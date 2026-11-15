// @author  veera
// @file    features/admin-support/components/TypingIndicator.tsx

export function TypingIndicator() {
  return (
    <div className="ai-chat__typing" role="status" aria-live="polite" aria-label="AI is typing">
      <span className="ai-chat__typing-label">T-Flux is typing</span>
      <span className="ai-chat__typing-dots" aria-hidden>
        <span className="ai-chat__typing-dot" />
        <span className="ai-chat__typing-dot" />
        <span className="ai-chat__typing-dot" />
      </span>
    </div>
  )
}
