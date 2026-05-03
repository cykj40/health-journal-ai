'use client'
import { useRef } from 'react'
import Link from 'next/link'
import RichTextEditor, { type RichTextEditorHandle } from './RichTextEditor'
import DailyPrompt from './DailyPrompt'
import HealthSnapshot from './HealthSnapshot'
import { MicButton } from './MicButton'
import { useVoiceDictation } from '@/hooks/useVoiceDictation'

interface EditorProps {
    entry: {
        id: string
        createdAt?: string
    }
    content: string
    onChange: (content: string) => void
    isNew?: boolean
    isSaved: boolean
    onSave: () => void
    onAnalyze: () => void
    onDelete: () => void
}

function formatEntryDate(dateStr?: string): string {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    })
}

const Editor = ({
    entry,
    content,
    onChange,
    isNew = false,
    isSaved,
    onSave,
    onAnalyze,
    onDelete,
}: EditorProps) => {
    const editorRef = useRef<RichTextEditorHandle>(null)
    const dateLabel = formatEntryDate(entry.createdAt)

    const { startRecording, stopRecording, isRecording, isTranscribing } = useVoiceDictation(
        (text) => editorRef.current?.insertContent(text)
    )

    return (
        <div className="flex flex-col w-full min-h-screen lg:h-full bg-gray-50 dark:bg-zinc-950">

            {/* ── Mobile top header ── */}
            <div
                className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-12 bg-white border-b border-sage-light/30"
                style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.92)' }}
            >
                <Link href="/journal" className="flex items-center gap-1.5 text-sm text-forest-muted hover:text-forest transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <span style={{ fontFamily: 'var(--font-dm-sans)' }}>Journal</span>
                </Link>
                <span className="text-sm font-medium text-forest" style={{ fontFamily: 'var(--font-playfair)' }}>
                    {dateLabel || 'Entry'}
                </span>
                <button
                    onClick={onDelete}
                    className="text-red-400 hover:text-red-600 transition-colors p-2 -mr-2"
                    style={{ minHeight: '44px', minWidth: '44px' }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-[680px] bg-white px-10 pt-10 pb-24 lg:pb-12 shadow-sm dark:bg-zinc-900 min-h-full">
                    {dateLabel && (
                        <p className="hidden lg:block mb-8 text-sm tracking-wide text-gray-400 dark:text-zinc-500 font-sans select-none">
                            {dateLabel}
                        </p>
                    )}

                    {isNew && (
                        <>
                            <HealthSnapshot entryId={entry.id} />
                            <DailyPrompt
                                onInsert={(text) => editorRef.current?.insertContent(text)}
                            />
                        </>
                    )}

                    <RichTextEditor
                        ref={editorRef}
                        content={content}
                        onChange={onChange}
                        placeholder="Write your entry..."
                    />

                    {/* ── Desktop toolbar (hidden on mobile) ── */}
                    <div className="mt-4 hidden lg:flex items-center gap-3">
                        <Link href="/journal" className="text-sm text-[#3D4A3A] opacity-60 hover:opacity-100 transition-opacity">
                            ← Journal
                        </Link>
                        <div className="flex-1" />
                        <MicButton
                            isRecording={isRecording}
                            isTranscribing={isTranscribing}
                            onStart={startRecording}
                            onStop={stopRecording}
                        />
                        <button
                            onClick={onAnalyze}
                            className="px-4 py-2 rounded-xl border border-[#A8C5A0] text-sm text-[#5C7A52] hover:bg-[#f0f5ee] transition-colors"
                        >
                            Analyze
                        </button>
                        <button
                            onClick={onDelete}
                            className="px-4 py-2 rounded-xl border border-red-300 text-sm text-red-500 hover:bg-red-50 transition-colors"
                        >
                            Delete
                        </button>
                        {isSaved && (
                            <span className="text-xs text-[#5C7A52] font-medium">✓ Saved</span>
                        )}
                        <button
                            onClick={onSave}
                            className="px-4 py-2 rounded-xl bg-[#5C7A52] text-white text-sm font-medium hover:bg-[#3D4A3A] transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Mobile bottom toolbar ── */}
            <div
                className="lg:hidden fixed left-0 right-0 z-30 bg-white border-t border-sage-light/30 px-4 py-2 flex items-center gap-3"
                style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.95)' }}
            >
                <MicButton
                    isRecording={isRecording}
                    isTranscribing={isTranscribing}
                    onStart={startRecording}
                    onStop={stopRecording}
                />
                <button
                    onClick={onAnalyze}
                    className="flex-1 py-2 rounded-xl border border-[#A8C5A0] text-sm text-[#5C7A52] hover:bg-[#f0f5ee] transition-colors text-center"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                    Analyze
                </button>
                <div className="flex items-center gap-2">
                    {isSaved && (
                        <span className="text-xs text-[#5C7A52] font-medium" style={{ fontFamily: 'var(--font-dm-sans)' }}>✓</span>
                    )}
                    <button
                        onClick={onSave}
                        className="px-5 py-2 rounded-xl bg-[#5C7A52] text-white text-sm font-medium hover:bg-[#3D4A3A] transition-colors"
                        style={{ fontFamily: 'var(--font-dm-sans)', minHeight: '44px' }}
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Editor
