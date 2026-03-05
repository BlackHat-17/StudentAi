import React, { useEffect, useRef, useState } from 'react'
import { askQuestion } from '../api'
import SourceReferences from './SourceReferences'

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

/** Skeleton loading lines shown while the AI is generating a response */
function SkeletonBubble() {
    return (
        <div className="animate-pulse space-y-2 py-1">
            <div className="h-3 bg-gray-700 rounded-full w-3/4" />
            <div className="h-3 bg-gray-700 rounded-full w-1/2" />
            <div className="h-3 bg-gray-700 rounded-full w-5/6" />
        </div>
    )
}

/**
 * Colour-coded confidence progress bar for AI answers.
 * confidence – number 0-100 (optional; nothing renders if undefined)
 */
function ConfidenceBar({ confidence }) {
    if (confidence === undefined || confidence === null) return null

    // Colour thresholds
    const colorClass =
        confidence >= 70
            ? 'bg-emerald-500'          // green  — high
            : confidence >= 40
                ? 'bg-yellow-400'       // yellow — medium
                : 'bg-red-500'          // red    — low

    const labelClass =
        confidence >= 70
            ? 'text-emerald-400'
            : confidence >= 40
                ? 'text-yellow-400'
                : 'text-red-400'

    return (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-1">
            <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-gray-500">Confidence</span>
                <span className={`text-xs font-semibold tabular-nums ${labelClass}`}>
                    {confidence}%
                </span>
            </div>
            {/* Track */}
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                {/* Fill */}
                <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${colorClass}`}
                    style={{ width: `${confidence}%` }}
                />
            </div>
        </div>
    )
}

/**
 * Shown when the backend returns no answer (answer === null / empty).
 * Styled in subtle yellow-gray — friendly, never alarming.
 */
function NoAnswerBubble() {
    return (
        <div className="flex items-start gap-3 animate-slide-up">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                            text-xs font-bold shadow-lg
                            bg-gradient-to-br from-violet-500 to-brand-600 text-white">
                AI
            </div>

            {/* Bubble — yellow-tinted, no sources, no confidence bar */}
            <div className="max-w-[72%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm
                            leading-relaxed shadow-md
                            bg-yellow-500/5 border border-yellow-500/20 text-yellow-200/80">
                <div className="flex items-start gap-2">
                    {/* Info icon */}
                    <svg className="w-4 h-4 text-yellow-400/70 flex-shrink-0 mt-0.5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836
                               a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0
                               9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                    </svg>
                    <p>
                        I don&apos;t have enough information in the notes to answer this question.
                    </p>
                </div>
            </div>
        </div>
    )
}

/**
 * Shown when a network / API error occurs.
 * Red-orange tint + warning icon + retry button.
 *
 * Props:
 *  detail   – string   optional error detail from the API
 *  onRetry  – () => void
 */
function ErrorBubble({ detail, onRetry }) {
    return (
        <div className="flex items-start gap-3 animate-msg-ai">
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                            text-xs font-bold shadow-lg
                            bg-gradient-to-br from-violet-500 to-brand-600 text-white">
                AI
            </div>

            {/* Bubble — red-orange tint */}
            <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-bl-sm text-sm
                            leading-relaxed shadow-md
                            bg-red-500/5 border border-red-500/20 text-red-200/85 space-y-2">

                {/* Warning icon + message */}
                <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5"
                        fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948
                               3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949
                               3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12
                               15.75h.007v.008H12v-.008z" />
                    </svg>
                    <div>
                        <p className="font-medium text-red-200">
                            Something went wrong while contacting the system.
                        </p>
                        {detail && (
                            <p className="text-xs text-red-300/60 mt-0.5 font-mono">{detail}</p>
                        )}
                    </div>
                </div>

                {/* Retry button */}
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg
                                   text-xs font-medium mt-2
                                   bg-red-500/10 border border-red-500/20
                                   text-red-300 hover:bg-red-500/20
                                   transition-colors duration-150"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor"
                            strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992
                                   m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031
                                   9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                        Try again
                    </button>
                )}
            </div>
        </div>
    )
}

/**
 * A single chat message bubble.
 *
 * Props:
 *  role       – 'user' | 'assistant'
 *  content    – string
 *  sources    – Array<{ page: number; snippet?: string }>  (assistant only)
 *  confidence – number 0-100 (optional, assistant only)
 *  noAnswer   – boolean  render the no-answer state instead of normal bubble
 *  isError    – boolean  render the error state with retry
 *  errorDetail– string   raw error message (optional)
 *  onRetry    – () => void  retry callback
 *  isTyping   – boolean
 */
function MessageBubble({ role, content, sources = [], confidence,
    noAnswer = false, isError = false, errorDetail, onRetry,
    isTyping = false }) {
    if (noAnswer) return <NoAnswerBubble />
    if (isError) return <ErrorBubble detail={errorDetail} onRetry={onRetry} />

    const isUser = role === 'user'

    return (
        <div className={`flex items-end gap-2.5 ${isUser
            ? 'flex-row-reverse animate-msg-user'   // slides in from right + scale pop
            : 'flex-row animate-msg-ai'             // fades up + gentle scale
            }`}>
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center
                    text-xs font-bold shadow-lg
                    ${isUser
                        ? 'bg-brand-600 text-white'
                        : 'bg-gradient-to-br from-violet-500 to-brand-600 text-white'
                    }`}
            >
                {isUser ? 'You' : 'AI'}
            </div>

            {/* Bubble */}
            <div
                className={`group relative max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md
          ${isUser
                        ? 'bg-brand-600 text-white rounded-br-sm'
                        : 'bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 rounded-bl-sm'
                    }`}
            >
                {isTyping ? (
                    <SkeletonBubble />
                ) : (
                    <>
                        <p className="whitespace-pre-wrap break-words">{content}</p>
                        {/* SourceReferences — renders page chips for assistant messages */}
                        {!isUser && <SourceReferences sources={sources} />}
                        {/* ConfidenceBar — optional, assistant messages only */}
                        {!isUser && <ConfidenceBar confidence={confidence} />}
                    </>
                )}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Main ChatWindow
───────────────────────────────────────────── */

/**
 * Self-contained ChatWindow component for a GenAI RAG system.
 *
 * Props:
 *  pdfUploaded  – boolean   whether a PDF has been uploaded
 *  onNewSources – (sources: Array<{page:number, snippet?:string}>) => void
 *                 called after each AI reply so the parent can display
 *                 sources in a separate panel
 */
export default function ChatWindow({ pdfUploaded = false, onNewSources }) {
    /* ── State ───────────────────────────────── */
    const [messages, setMessages] = useState([
        {
            id: 0,
            role: 'assistant',
            content: pdfUploaded
                ? "I've loaded your notes! Ask me anything."
                : "Upload your handwritten notes PDF, then ask me any question.",
            sources: [],
        },
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    /* ── Auto-scroll: fires when a new message is added ──────── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    /* ── Auto-scroll: fires when skeleton appears/disappears ─── */
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [loading])

    /* ── Update greeting when PDF is loaded ──── */
    useEffect(() => {
        if (pdfUploaded) {
            setMessages((prev) => {
                if (prev.length === 1 && prev[0].id === 0) {
                    return [{ ...prev[0], content: "I've loaded your notes! Ask me anything." }]
                }
                return prev
            })
        }
    }, [pdfUploaded])

    /* ── Send message ────────────────────────── */
    const handleSend = async () => {
        const text = input.trim()
        if (!text || loading || !pdfUploaded) return

        // Append user message
        const userMsg = { id: Date.now(), role: 'user', content: text, sources: [] }
        setMessages((prev) => [...prev, userMsg])
        setInput('')
        setLoading(true)

        // Build conversation history — last 5 messages sent to /ask
        const history = messages
            .slice(-5)
            .map(({ role, content }) => ({ role, content }))

        try {
            const data = await askQuestion(text, history)

            // Detect no-answer state: null/empty answer from backend
            const hasAnswer = data.answer !== null && data.answer !== undefined && data.answer.trim() !== ''
            const sources = hasAnswer ? (data.sources || []) : []

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: hasAnswer ? data.answer : '',
                    sources,
                    confidence: hasAnswer ? (data.confidence ?? undefined) : undefined,
                    noAnswer: !hasAnswer,  // flag triggers NoAnswerBubble
                },
            ])

            // Only push sources to right panel when we actually have an answer
            if (hasAnswer) onNewSources?.(sources)
        } catch (err) {
            // Store the failed question so the retry button can re-send it
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    role: 'assistant',
                    content: '',
                    sources: [],
                    isError: true,
                    errorDetail: err.message || '',
                    failedQuestion: text,  // used by retry
                },
            ])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    /* ── Retry failed message ────────────────── */
    const handleRetry = (failedMsg) => {
        // Remove the error bubble from history
        setMessages((prev) => prev.filter((m) => m.id !== failedMsg.id))
        // Re-send the question text
        setInput(failedMsg.failedQuestion)
        // Need a tiny timeout to ensure state settles before sending
        setTimeout(() => {
            const sendBtn = document.getElementById('send-btn')
            if (sendBtn) sendBtn.click()
        }, 50)
    }

    /* ── Render ──────────────────────────────── */
    return (
        <div className="flex flex-col h-full bg-gray-950">

            {/* ── Message list ───────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.map((msg) => (
                    <MessageBubble
                        key={msg.id}
                        role={msg.role}
                        content={msg.content}
                        sources={msg.sources}
                        confidence={msg.confidence}
                        noAnswer={msg.noAnswer}
                        isError={msg.isError}
                        errorDetail={msg.errorDetail}
                        onRetry={msg.isError ? () => handleRetry(msg) : undefined}
                    />
                ))}

                {/* Typing indicator while loading */}
                {loading && <MessageBubble role="assistant" content="" isTyping />}

                <div ref={messagesEndRef} />
            </div>

            {/* ── Context memory badge ────────────────── */}
            <div className="flex justify-center px-4 pt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
                                 bg-white/5 border border-white/10
                                 text-[11px] text-gray-500 select-none">
                    {/* Brain icon */}
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor"
                        strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 00.75-1.682V6.75a2.25 2.25 0 00-2.25-2.25h-1.5m-9 0V4.5A2.25 2.25 0 0110.5 2.25h3A2.25 2.25 0 0115.75 4.5v.104M19.8 15l-1.178 1.178a2.25 2.25 0 01-1.591.659H6.97a2.25 2.25 0 01-1.591-.659L4.2 15m15.6 0H4.2" />
                    </svg>
                    Context Memory: Last 5 messages
                </span>
            </div>

            {/* ── Input bar ──────────────────────────── */}
            <div className="px-3 pb-4 pt-2 sm:px-5">
                {/* Outer wrapper — the "box" the user sees */}
                <div
                    className={`relative flex flex-col rounded-2xl
                                bg-gray-900 border
                                transition-all duration-200
                                ${pdfUploaded && !loading
                            ? 'border-white/10 focus-within:border-brand-500/50 focus-within:shadow-lg focus-within:shadow-brand-600/10'
                            : 'border-white/5 opacity-60'
                        }`}
                >
                    {/* Textarea — grows up to ~6 lines */}
                    <textarea
                        ref={inputRef}
                        id="chat-input"
                        rows={1}
                        maxLength={2000}
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value)
                            // Auto-grow: reset then let scrollHeight expand
                            e.target.style.height = 'auto'
                            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder={
                            pdfUploaded
                                ? 'Ask a question about your notes...'
                                : 'Upload a PDF first to start chatting...'
                        }
                        disabled={!pdfUploaded || loading}
                        className="w-full bg-transparent resize-none text-sm text-gray-100
                                   placeholder-gray-600 outline-none leading-relaxed
                                   px-4 pt-4 pb-2 disabled:cursor-not-allowed"
                        style={{ scrollbarWidth: 'none', minHeight: '52px', maxHeight: '160px' }}
                    />

                    {/* Bottom row: char counter + send button */}
                    <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">

                        {/* Left: keyboard hint + char counter */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-[11px] text-gray-600 hidden sm:inline">
                                <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">Enter</kbd>
                                {' '}send &nbsp;·&nbsp;
                                <kbd className="bg-white/10 px-1 py-0.5 rounded text-[10px]">⇧ Enter</kbd>
                                {' '}newline
                            </span>

                            {/* Character counter — turns yellow at 80 %, red at 95 % */}
                            {input.length > 0 && (
                                <span className={`text-[11px] tabular-nums
                                    ${input.length >= 1900
                                        ? 'text-red-400'
                                        : input.length >= 1600
                                            ? 'text-yellow-400'
                                            : 'text-gray-600'
                                    }`}>
                                    {input.length} / 2000
                                </span>
                            )}
                        </div>

                        {/* Send button */}
                        <button
                            id="send-btn"
                            onClick={handleSend}
                            disabled={!pdfUploaded || !input.trim() || loading}
                            aria-label="Send message"
                            className="flex-shrink-0 flex items-center justify-center gap-1.5
                                       h-9 px-4 rounded-xl
                                       bg-brand-600 hover:bg-brand-500
                                       text-white text-xs font-semibold
                                       transition-all duration-200 active:scale-95
                                       disabled:opacity-30 disabled:cursor-not-allowed
                                       disabled:hover:bg-brand-600"
                        >
                            {loading ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                            stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    <span className="hidden sm:inline">Thinking…</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor"
                                        strokeWidth="2.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                    <span className="hidden sm:inline">Send</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
