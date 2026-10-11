'use client'

import { useState } from 'react'

interface PatternResult {
    recurringThemes: string
    habitPatterns: string
    healthFlags: string
    moodEnergyCorrelations: string
}

interface PatternsClientProps {
    healthMetrics: Record<string, unknown>[]
    entryAnalysis: Record<string, unknown>[]
}

const cardConfig = [
    { key: 'recurringThemes' as const, title: 'Recurring Health Themes', subtitle: 'Sleep, stress, exercise & nutrition patterns' },
    { key: 'habitPatterns' as const, title: 'Habit Patterns', subtitle: 'Frequent good and bad habits detected' },
    { key: 'healthFlags' as const, title: 'Health Flags', subtitle: 'Warning patterns worth your attention' },
    { key: 'moodEnergyCorrelations' as const, title: 'Mood & Energy Correlations', subtitle: 'How mood tracks with energy over time' },
]

export default function PatternsClient({ healthMetrics, entryAnalysis }: PatternsClientProps) {
    const [result, setResult] = useState<PatternResult | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleGenerate = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/patterns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ healthMetrics, entryAnalysis }),
            })
            if (!res.ok) throw new Error('Request failed')
            const { data } = await res.json()
            setResult(data)
        } catch {
            setError('Failed to generate patterns. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="px-6 pt-6 pb-4 lg:max-w-3xl lg:mx-auto overflow-y-auto">
            {/* Heading */}
            <div className="mb-8">
                <h1
                    className="text-3xl font-semibold text-forest leading-tight"
                    style={{ fontFamily: 'var(--font-playfair)' }}
                >
                    Patterns
                </h1>
                <p
                    className="text-forest-muted text-sm mt-1"
                    style={{ fontFamily: 'var(--font-dm-sans)' }}
                >
                    AI-generated insights from your journal history
                </p>
            </div>

            {/* Generate button */}
            <div className="mb-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
                <button
                    onClick={() => void handleGenerate()}
                    disabled={loading}
                    className="bg-sage text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-forest transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {loading ? 'Analyzing…' : 'Generate Patterns'}
                </button>
                {error && (
                    <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div className="space-y-4">
                    {cardConfig.map(({ key }) => (
                        <div key={key} className="bg-white rounded-2xl border border-sage-light/30 shadow-xs p-5 animate-pulse">
                            <div className="h-4 bg-sage-light/40 rounded-sm w-1/3 mb-3" />
                            <div className="space-y-2">
                                <div className="h-3 bg-sage-light/30 rounded-sm w-full" />
                                <div className="h-3 bg-sage-light/30 rounded-sm w-5/6" />
                                <div className="h-3 bg-sage-light/30 rounded-sm w-4/6" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results */}
            {!loading && result && (
                <div className="space-y-4">
                    {cardConfig.map(({ key, title, subtitle }) => (
                        <div key={key} className="bg-white rounded-2xl border border-sage-light/30 shadow-xs p-5">
                            <h2
                                className="text-sm font-semibold text-forest mb-0.5"
                                style={{ fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {title}
                            </h2>
                            <p
                                className="text-xs text-forest-muted mb-3"
                                style={{ fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {subtitle}
                            </p>
                            <p
                                className="text-sm text-forest leading-relaxed"
                                style={{ fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {result[key]}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!loading && !result && (
                <div className="mt-16 flex flex-col items-center gap-3">
                    <p
                        className="text-sm text-forest-muted text-center"
                        style={{ fontFamily: 'var(--font-dm-sans)' }}
                    >
                        No patterns generated yet.
                        <br />Hit Generate to analyze your last 90 days.
                    </p>
                </div>
            )}
        </div>
    )
}
