import React, { useState } from 'react'
import ChatWindow from './components/ChatWindow'
import PdfUpload from './components/PdfUpload'
import SourceReferences from './components/SourceReferences'

export default function App() {
  const [pdfUploaded, setPdfUploaded] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [latestSources, setLatestSources] = useState([])

  const handleUploaded = (fileName) => {
    setPdfUploaded(true)
    setUploadedFileName(fileName)
    setLatestSources([])           // clear stale sources on new PDF
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-950 font-sans">

      {/* ── Top bar ──────────────────────────────────────────────── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3
                         border-b border-white/5 bg-gray-900/80 backdrop-blur-sm z-10">
        {/* Logo */}
        <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor"
            strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13
                 C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477
                 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477
                 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-white leading-tight">StudentAI</h1>
          <p className="text-xs text-gray-500 truncate">Handwritten Notes Assistant</p>
        </div>

        {/* Status pill */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium flex-shrink-0
          ${pdfUploaded
            ? 'bg-emerald-500/10 text-emerald-400'
            : 'bg-yellow-500/10 text-yellow-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full
            ${pdfUploaded ? 'bg-emerald-400' : 'bg-yellow-400 animate-pulse'}`} />
          {pdfUploaded ? `Notes ready — ${uploadedFileName}` : 'Awaiting PDF'}
        </div>
      </header>

      {/* ── 3-column body ─────────────────────────────────────────── */}
      {/*
          xl:  left 280px | center flex-1 | right 280px
          lg:  left 240px | center flex-1 | right hidden
          md:  left 220px | center flex-1 | no right panel
          sm:  stacked (left on top, center below)
      */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── LEFT PANEL — PDF Upload ─────────────────────────────── */}
        <aside className="hidden md:flex flex-col flex-shrink-0 w-56 lg:w-64 xl:w-72
                          border-r border-white/5 bg-gray-900/60 overflow-y-auto">

          {/* Upload section */}
          <div className="border-b border-white/5">
            <PdfUpload onUploaded={handleUploaded} />
          </div>

          {/* Active file indicator */}
          {pdfUploaded && (
            <div className="px-4 py-3 border-b border-white/5 animate-fade-in">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-2">
                Active Notes
              </p>
              <div className="flex items-center gap-2 bg-white/5 border border-white/10
                              rounded-xl px-3 py-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z" />
                  <path d="M14 2v6h6" />
                </svg>
                <span className="text-xs text-gray-300 truncate flex-1">{uploadedFileName}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" title="Ready" />
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="px-4 py-4 mt-auto">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Tips</p>
              <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside leading-relaxed">
                <li>Upload a scanned PDF</li>
                <li>Ask specific topic questions</li>
                <li>Check page refs on the right</li>
              </ul>
            </div>
          </div>
        </aside>

        {/* ── CENTER — Chat  ──────────────────────────────────────── */}
        <main className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
          {/* Mobile-only upload strip */}
          <div className="md:hidden border-b border-white/5 bg-gray-900/60">
            <PdfUpload onUploaded={handleUploaded} />
          </div>

          <ChatWindow
            pdfUploaded={pdfUploaded}
            onNewSources={setLatestSources}
          />
        </main>

        {/* ── RIGHT PANEL — Source References ────────────────────── */}
        <aside className="hidden xl:flex flex-col flex-shrink-0 w-64 2xl:w-72
                          border-l border-white/5 bg-gray-900/60 overflow-y-auto px-4 py-5">

          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 mb-3">
            Source References
          </p>

          {latestSources.length > 0 ? (
            /* Render page chips via the shared SourceReferences component.
               We strip the top border/label since we have our own panel header. */
            <div className="space-y-2">
              {latestSources.map((src) => (
                <div key={src.page}
                  className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                                  bg-brand-600/10 border border-brand-600/20
                                  hover:bg-brand-600/20 transition-colors duration-150 cursor-default">
                    <svg className="w-4 h-4 text-brand-400 flex-shrink-0" fill="none"
                      stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5
                           A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0
                           00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12
                           M10.5 2.25H5.625c-.621 0-1.125.504-1.125
                           1.125v17.25c0 .621.504 1.125 1.125
                           1.125h12.75c.621 0 1.125-.504
                           1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                    <span className="text-sm font-medium text-brand-300">Page {src.page}</span>
                  </div>

                  {src.snippet && (
                    <p className="text-xs text-gray-500 leading-relaxed px-2 line-clamp-3">
                      "{src.snippet}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-10">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10
                              flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor"
                  strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5
                       A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0
                       00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125
                       1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621
                       0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Page references will<br />appear here after a reply
              </p>
            </div>
          )}
        </aside>

      </div>
    </div>
  )
}
