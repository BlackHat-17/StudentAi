import React, { useRef, useState, useCallback } from 'react'
import { uploadPdf } from '../api'

/* ─────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────── */

function ProgressBar({ value }) {
    return (
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
                className="h-full bg-brand-500 rounded-full transition-all duration-200 ease-out"
                style={{ width: `${value}%` }}
            />
        </div>
    )
}

/* ─────────────────────────────────────────────
   PdfUpload
───────────────────────────────────────────── */

/**
 * PDF Upload component.
 *
 * Props:
 *  onUploaded – (fileName: string) => void  called on success
 */
export default function PdfUpload({ onUploaded }) {
    const fileInputRef = useRef(null)

    // status: 'idle' | 'uploading' | 'success' | 'error'
    const [status, setStatus] = useState('idle')
    const [fileName, setFileName] = useState('')
    const [progress, setProgress] = useState(0)
    const [errorMsg, setErrorMsg] = useState('')
    const [dragging, setDragging] = useState(false)

    /* ── Core upload logic ─────────────────── */
    const processFile = useCallback(async (file) => {
        if (!file) return

        if (file.type !== 'application/pdf') {
            setStatus('error')
            setErrorMsg('Only PDF files are supported.')
            return
        }

        setFileName(file.name)
        setProgress(0)
        setStatus('uploading')
        setErrorMsg('')

        try {
            // uploadPdf from api.js accepts (file, onProgress) — uses axios onUploadProgress
            await uploadPdf(file, setProgress)
            setProgress(100)
            setStatus('success')
            onUploaded?.(file.name)
        } catch (err) {
            setStatus('error')
            setErrorMsg(err.message || 'Upload failed.')
        }
    }, [onUploaded])

    /* ── File input handler ────────────────── */
    const handleInputChange = (e) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
        e.target.value = '' // allow re-selecting same file
    }

    /* ── Drag & Drop ───────────────────────── */
    const handleDragOver = (e) => { e.preventDefault(); setDragging(true) }
    const handleDragLeave = () => setDragging(false)
    const handleDrop = (e) => {
        e.preventDefault()
        setDragging(false)
        processFile(e.dataTransfer.files?.[0])
    }

    /* ── Reset ─────────────────────────────── */
    const handleReset = () => {
        setStatus('idle')
        setFileName('')
        setProgress(0)
        setErrorMsg('')
    }

    /* ── Render ────────────────────────────── */
    return (
        <div className="p-4 space-y-3">
            {/* Section label */}
            <h2 className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                Upload Notes
            </h2>

            {/* ── Drop zone ──────────────────────── */}
            <div
                onClick={() => status !== 'uploading' && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative cursor-pointer rounded-xl border-2 border-dashed p-5
          flex flex-col items-center gap-3 text-center
          transition-all duration-200 select-none
          ${dragging
                        ? 'border-brand-400 bg-brand-600/10 scale-[1.01]'
                        : status === 'success'
                            ? 'border-emerald-500/40 bg-emerald-500/5 cursor-default'
                            : status === 'error'
                                ? 'border-red-500/40 bg-red-500/5'
                                : 'border-white/10 hover:border-brand-500/50 hover:bg-white/5'
                    }
          ${status === 'uploading' ? 'pointer-events-none' : ''}`}
            >
                <input
                    ref={fileInputRef}
                    id="pdf-file-input"
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={handleInputChange}
                />

                {/* ── Idle state ─────────────────── */}
                {status === 'idle' && (
                    <>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor"
                                strokeWidth="1.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm text-gray-300">
                                Drop PDF here or{' '}
                                <span className="text-brand-400 underline underline-offset-2">choose file</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">PDF up to 50 MB</p>
                        </div>
                    </>
                )}

                {/* ── Uploading state ────────────── */}
                {status === 'uploading' && (
                    <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-brand-400 animate-spin flex-shrink-0"
                                fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                    stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            <span className="text-sm text-gray-300 truncate flex-1 text-left">{fileName}</span>
                            <span className="text-xs text-brand-400 font-mono flex-shrink-0">{progress}%</span>
                        </div>
                        <ProgressBar value={progress} />
                    </div>
                )}

                {/* ── Success state ──────────────── */}
                {status === 'success' && (
                    <div className="w-full flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30
                            flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor"
                                strokeWidth="2.5" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm text-emerald-400 font-medium">Uploaded successfully</p>
                            <p className="text-xs text-gray-400 truncate">{fileName}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleReset() }}
                            className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors p-1"
                            title="Upload a different file"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor"
                                strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* ── Error state ────────────────── */}
                {status === 'error' && (
                    <div className="w-full space-y-2">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" stroke="currentColor"
                                strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                            </svg>
                            <p className="text-sm text-red-400">{errorMsg}</p>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); handleReset() }}
                            className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                        >
                            Try again
                        </button>
                    </div>
                )}
            </div>

            {/* ── Standalone upload button (idle / error) ── */}
            {(status === 'idle' || status === 'error') && (
                <button
                    id="pdf-upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                     bg-brand-600 hover:bg-brand-500 active:scale-95
                     text-white text-sm font-medium transition-all duration-200"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor"
                        strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 7.5m0 0L7.5 12M12 7.5V18" />
                    </svg>
                    {status === 'error' ? 'Retry Upload' : 'Upload PDF'}
                </button>
            )}
        </div>
    )
}
