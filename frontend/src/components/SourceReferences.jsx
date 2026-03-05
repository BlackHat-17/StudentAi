import React, { useState, useRef, useEffect } from 'react'

/**
 * SourceReferences.jsx
 *
 * Displays source page chips with click-to-expand snippet previews
 * and smooth CSS height transition animation.
 *
 * Props:
 *  sources  – Array<{ page: number; snippet?: string }>
 *  onSelect – (page: number) => void   optional
 */
export default function SourceReferences({ sources = [], onSelect }) {
    const [openPage, setOpenPage] = useState(null)

    if (!sources.length) return null

    const toggle = (page) => {
        setOpenPage((prev) => (prev === page ? null : page))
        onSelect?.(page)
    }

    return (
        <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
            {/* Label */}
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Sources
            </p>

            {/* Chips row */}
            <div className="flex flex-wrap gap-2">
                {sources.map((src) => {
                    const isOpen = openPage === src.page
                    const hasSnippet = !!src.snippet

                    return (
                        <div key={src.page} className="flex flex-col gap-1 w-full sm:w-auto">

                            {/* ── Chip button ─────────────────────── */}
                            <button
                                onClick={() => toggle(src.page)}
                                aria-expanded={isOpen}
                                aria-label={`Source page ${src.page}`}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                            text-xs font-medium border
                            transition-all duration-200 focus:outline-none
                            focus-visible:ring-2 focus-visible:ring-brand-400
                            ${isOpen
                                        ? 'bg-brand-600/30 border-brand-500/60 text-brand-200 shadow-sm shadow-brand-600/20'
                                        : 'bg-brand-600/10 border-brand-600/20 text-brand-300 hover:bg-brand-600/20 hover:border-brand-500/40'
                                    }`}
                            >
                                {/* Page icon */}
                                <svg className="w-3 h-3 flex-shrink-0 opacity-70" fill="none"
                                    stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round"
                                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5
                       A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0
                       00-3.375-3.375H8.25m2.25 12.75h7.5m-7.5 3H12
                       M10.5 2.25H5.625c-.621 0-1.125.504-1.125
                       1.125v17.25c0 .621.504 1.125 1.125
                       1.125h12.75c.621 0 1.125-.504
                       1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>

                                Page {src.page}

                                {/* Caret — only when snippet available */}
                                {hasSnippet && (
                                    <svg
                                        className={`w-3 h-3 ml-0.5 transition-transform duration-300
                                ${isOpen ? 'rotate-180' : 'rotate-0'}`}
                                        fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                )}
                            </button>

                            {/* ── Animated snippet panel ──────────── */}
                            <SnippetPanel text={src.snippet} open={isOpen && hasSnippet} page={src.page} />

                        </div>
                    )
                })}
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   SnippetPanel — smooth height animation
   Uses a ref to measure natural content height,
   then transitions max-height for a smooth open.
───────────────────────────────────────────── */
function SnippetPanel({ text, open, page }) {
    const contentRef = useRef(null)
    const [maxH, setMaxH] = useState('0px')

    // Measure real height and animate
    useEffect(() => {
        if (!contentRef.current) return
        setMaxH(open ? `${contentRef.current.scrollHeight}px` : '0px')
    }, [open])

    if (!text) return null

    return (
        <div
            style={{ maxHeight: maxH, overflow: 'hidden', transition: 'max-height 0.3s ease' }}
        >
            <div
                ref={contentRef}
                className="ml-1 px-3 py-2.5 rounded-xl
                   bg-white/5 border border-white/10
                   text-xs text-gray-400 leading-relaxed"
            >
                {/* Page label */}
                <p className="text-[10px] font-semibold text-brand-400 mb-1">Page {page}</p>
                {/* Quoted snippet */}
                <p>
                    <span className="text-gray-500">"</span>
                    {text}
                    <span className="text-gray-500">"</span>
                </p>
            </div>
        </div>
    )
}
