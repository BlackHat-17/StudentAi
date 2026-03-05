import React from 'react'

/**
 * A single chat bubble.
 *
 * Props:
 *  - role: 'user' | 'assistant'
 *  - content: string
 *  - isTyping: boolean  (shows animated dots)
 */
export default function MessageBubble({ role, content, isTyping = false }) {
    const isUser = role === 'user'

    return (
        <div
            className={`flex items-end gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
        >
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
          ${isUser
                        ? 'bg-brand-600 text-white'
                        : 'bg-gradient-to-br from-violet-500 to-brand-600 text-white'
                    }`}
            >
                {isUser ? 'You' : 'AI'}
            </div>

            {/* Bubble */}
            <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg
          ${isUser
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'glass text-gray-100 rounded-bl-sm'
                    }`}
            >
                {isTyping ? (
                    <TypingIndicator />
                ) : (
                    <p className="whitespace-pre-wrap break-words">{content}</p>
                )}
            </div>
        </div>
    )
}

function TypingIndicator() {
    return (
        <span className="flex items-center gap-1 h-4">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse-dot"
                    style={{ animationDelay: `${i * 0.2}s` }}
                />
            ))}
        </span>
    )
}
