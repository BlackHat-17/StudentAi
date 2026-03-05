/**
 * api.js
 * -------
 * Centralised API client for the StudentAI backend.
 * All components import from here — nothing talks to the network directly.
 *
 * Base URL defaults to http://localhost:8000.
 * Override at build time with the VITE_API_URL environment variable.
 */

import axios from 'axios'

/* ─────────────────────────────────────────────
   Axios instance
───────────────────────────────────────────── */

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    timeout: 60_000, // 60 s — large PDFs + LLM inference can be slow
})

/* ── Response interceptor: unwrap error messages ── */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const detail =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            'Unexpected error'
        return Promise.reject(new Error(detail))
    },
)

/* ─────────────────────────────────────────────
   askQuestion(question, history)
   POST /ask
   ─────────────────────────────────────────────
   @param {string}  question  – user's current question
   @param {Array}   history   – prior turns [{ role, content }, …]

   @returns {Promise<{
     answer:  string,
     sources: number[]          // page numbers, e.g. [2, 5]
   }>}
───────────────────────────────────────────── */
export async function askQuestion(question, history = []) {
    const { data } = await api.post('/ask', { question, history })
    return data // { answer, sources }
}

/* ─────────────────────────────────────────────
   uploadPdf(file, onProgress?)
   POST /upload-pdf
   ─────────────────────────────────────────────
   @param {File}     file        – PDF File object
   @param {Function} onProgress  – optional (percent: number) => void

   @returns {Promise<{ message: string }>}
───────────────────────────────────────────── */
export async function uploadPdf(file, onProgress) {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post('/upload-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
            ? (e) => {
                if (e.total) onProgress(Math.round((e.loaded / e.total) * 100))
            }
            : undefined,
    })

    return data // { message }
}

export default api
