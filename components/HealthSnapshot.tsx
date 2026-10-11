'use client'

import { useState } from 'react'
import { type HealthSnapshot } from '@/utils/types'

interface HealthSnapshotProps {
    entryId: string
}

const MOOD_OPTIONS = ['😔', '😐', '🙂', '😄', '🤩']

function StarRow({
    label,
    value,
    onChange,
}: {
    label: string
    value: number
    onChange: (v: number) => void
}) {
    return (
        <div className="flex items-center gap-3">
            <span className="w-14 text-xs text-gray-500 dark:text-zinc-400 shrink-0">{label}</span>
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                    <button
                        key={n}
                        type="button"
                        onClick={() => onChange(n)}
                        className="transition-transform hover:scale-110 focus:outline-hidden"
                        title={`${label} ${n}`}
                    >
                        <svg
                            className={`w-5 h-5 ${n <= value ? 'text-violet-500' : 'text-gray-200 dark:text-zinc-700'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                ))}
            </div>
        </div>
    )
}

const HealthSnapshotWidget = ({ entryId }: HealthSnapshotProps) => {
    const [energy, setEnergy] = useState(0)
    const [stress, setStress] = useState(0)
    const [sleepHours, setSleepHours] = useState<string>('')
    const [mood, setMood] = useState<string>('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const canSave = energy > 0 || stress > 0 || sleepHours !== '' || mood !== ''

    const handleSave = async () => {
        if (!canSave) return
        setSaving(true)
        try {
            const snapshot: HealthSnapshot = {
                energy,
                stress,
                sleepHours: sleepHours !== '' ? parseFloat(sleepHours) : 0,
                mood,
            }
            await fetch(`/api/journal/${entryId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ healthSnapshot: JSON.stringify(snapshot) }),
            })
            setSaved(true)
        } catch (err) {
            console.error('Failed to save health snapshot:', err)
        } finally {
            setSaving(false)
        }
    }

    if (saved) {
        return (
            <div className="mb-6 flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-500">
                <svg className="w-3.5 h-3.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Check-in saved
            </div>
        )
    }

    return (
        <div className="mb-8 rounded-xl border border-gray-100 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-800/40 px-5 py-4">
            <p className="text-xs font-medium text-gray-400 dark:text-zinc-500 mb-4 tracking-wide uppercase">
                Quick check-in
            </p>

            <div className="space-y-3">
                <StarRow label="Energy" value={energy} onChange={setEnergy} />
                <StarRow label="Stress" value={stress} onChange={setStress} />

                <div className="flex items-center gap-3">
                    <span className="w-14 text-xs text-gray-500 dark:text-zinc-400 shrink-0">Sleep</span>
                    <div className="flex items-center gap-1.5">
                        <input
                            type="number"
                            min={0}
                            max={24}
                            step={0.5}
                            value={sleepHours}
                            onChange={e => setSleepHours(e.target.value)}
                            placeholder="7.5"
                            className="w-16 px-2 py-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-200 focus:outline-hidden focus:ring-1 focus:ring-violet-300 dark:focus:ring-violet-700 text-center"
                        />
                        <span className="text-xs text-gray-400 dark:text-zinc-500">hrs</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="w-14 text-xs text-gray-500 dark:text-zinc-400 shrink-0">Mood</span>
                    <div className="flex gap-1.5">
                        {MOOD_OPTIONS.map(emoji => (
                            <button
                                key={emoji}
                                type="button"
                                onClick={() => setMood(emoji === mood ? '' : emoji)}
                                className={`text-xl transition-all hover:scale-110 focus:outline-hidden rounded-lg p-0.5 ${
                                    mood === emoji
                                        ? 'ring-2 ring-violet-400 bg-violet-50 dark:bg-violet-900/30'
                                        : 'opacity-60 hover:opacity-100'
                                }`}
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="mt-4 px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
                {saving ? 'Saving...' : 'Save check-in'}
            </button>
        </div>
    )
}

export default HealthSnapshotWidget
