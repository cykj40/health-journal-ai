'use client'

import { type Analysis, type HealthSnapshot } from '@/utils/types'

interface MobileAnalysisCardProps {
    analysis: Analysis
    healthSnapshot?: string
    isVisible: boolean
    onClose: () => void
}

function parseSnapshot(raw?: string): HealthSnapshot | null {
    if (!raw) return null
    try {
        return JSON.parse(raw) as HealthSnapshot
    } catch {
        return null
    }
}

function ScoreBar({ score }: { score: number }) {
    const pct = ((score + 10) / 20) * 100
    const color =
        score >= 5 ? 'bg-emerald-400' : score >= 0 ? 'bg-amber-400' : 'bg-rose-400'
    return (
        <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs tabular-nums text-gray-400 w-6 text-right">
                {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
            </span>
        </div>
    )
}

function HealthRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="w-4 text-gray-400">{icon}</span>
            <span className="w-14 shrink-0">{label}</span>
            <span className="font-medium text-gray-700">{value}</span>
        </div>
    )
}

const MobileAnalysisCard = ({ analysis, healthSnapshot, isVisible, onClose }: MobileAnalysisCardProps) => {
    const hasAnalysis = analysis.mood || analysis.subject || analysis.sentimentScore !== 0
    const snapshot = parseSnapshot(healthSnapshot)

    return (
        <>
            {/* Backdrop */}
            {isVisible && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Card */}
            <div
                className={`fixed top-0 left-0 right-0 z-50 lg:hidden bg-white rounded-b-2xl shadow-2xl border-b border-sage-light/30 transition-transform duration-300 ease-out ${
                    isVisible ? 'translate-y-0' : '-translate-y-full'
                }`}
            >
                {/* Drag handle */}
                <div className="w-10 h-1 bg-sage-light rounded-full mx-auto mt-3 mb-2" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-4 text-forest-muted hover:text-forest transition-colors"
                    aria-label="Close"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Scrollable content */}
                <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-3 text-sm">
                    {!hasAnalysis ? (
                        <p className="text-xs text-gray-400 italic">Analysis will appear after you run Analyze…</p>
                    ) : (
                        <>
                            {analysis.mood && (
                                <div className="flex items-center gap-2">
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                                        style={{ backgroundColor: analysis.color || '#6366f1' }}
                                    >
                                        {analysis.mood}
                                    </span>
                                </div>
                            )}

                            {analysis.subject && (
                                <p className="text-xs text-gray-500 leading-snug">{analysis.subject}</p>
                            )}

                            {analysis.sentimentScore !== 0 && (
                                <div>
                                    <span className="text-[10px] text-gray-400">Sentiment</span>
                                    <ScoreBar score={analysis.sentimentScore} />
                                </div>
                            )}

                            {analysis.coachingInsight && analysis.coachingRecommendation && (
                                <div className="pt-2 space-y-2 border-t border-gray-100">
                                    <p className="text-xs text-gray-600 leading-relaxed">{analysis.coachingInsight}</p>
                                    <div className="flex gap-1.5 items-start bg-sage-light/30 rounded-lg px-2.5 py-2">
                                        <span className="text-sage text-xs">→</span>
                                        <p className="text-xs text-forest leading-relaxed">{analysis.coachingRecommendation}</p>
                                    </div>
                                </div>
                            )}

                            {snapshot && (
                                <div className="pt-1 space-y-1.5 border-t border-gray-100">
                                    {snapshot.energy > 0 && (
                                        <HealthRow
                                            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                                            label="Energy"
                                            value={`${snapshot.energy}/5`}
                                        />
                                    )}
                                    {snapshot.stress > 0 && (
                                        <HealthRow
                                            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            label="Stress"
                                            value={`${snapshot.stress}/5`}
                                        />
                                    )}
                                    {snapshot.sleepHours > 0 && (
                                        <HealthRow
                                            icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>}
                                            label="Sleep"
                                            value={`${snapshot.sleepHours}h`}
                                        />
                                    )}
                                    {snapshot.mood && (
                                        <HealthRow
                                            icon={<span className="text-sm leading-none">✦</span>}
                                            label="Mood"
                                            value={snapshot.mood}
                                        />
                                    )}
                                </div>
                            )}

                            {analysis.negative && (
                                <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1.5">
                                    <span>⚠</span>
                                    <span>Difficult day noted</span>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    )
}

export default MobileAnalysisCard
