'use client'

import { type Entry } from '@/utils/types'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import EntryCard from '@/components/EntryCard'

function groupByMonth(entries: Entry[]): Array<{ month: string; entries: Entry[] }> {
    const map = new Map<string, Entry[]>()
    for (const e of entries) {
        const key = new Date(e.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        if (!map.has(key)) map.set(key, [])
        map.get(key)!.push(e)
    }
    return Array.from(map.entries()).map(([month, entries]) => ({ month, entries }))
}

export default function EntriesClient() {
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [mood, setMood] = useState('')

    const [offset, setOffset] = useState(0)
    const [entries, setEntries] = useState<Entry[]>([])
    const [hasMore, setHasMore] = useState(false)
    const [loading, setLoading] = useState(false)

    // Debounce the search input by 400ms
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedQ(q), 400)
        return () => clearTimeout(timer)
    }, [q])

    // Reset pagination whenever filters change
    useEffect(() => {
        setOffset(0)
    }, [debouncedQ, startDate, endDate, mood])

    // Fetch results on mount and whenever filters or offset change
    useEffect(() => {
        const controller = new AbortController()

        const fetchEntries = async () => {
            setLoading(true)
            try {
                const params = new URLSearchParams()
                if (debouncedQ) params.set('q', debouncedQ)
                if (startDate && endDate) {
                    params.set('startDate', startDate)
                    params.set('endDate', endDate)
                }
                if (mood) params.set('mood', mood)
                if (offset) params.set('offset', String(offset))

                const res = await fetch(`/api/entries?${params.toString()}`, {
                    signal: controller.signal,
                })
                if (!res.ok) throw new Error('Request failed')
                const { data, hasMore: more } = await res.json()

                setEntries((prev) => (offset === 0 ? data : [...prev, ...data]))
                setHasMore(Boolean(more))
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    setEntries((prev) => (offset === 0 ? [] : prev))
                    setHasMore(false)
                }
            } finally {
                setLoading(false)
            }
        }

        void fetchEntries()
        return () => controller.abort()
    }, [debouncedQ, startDate, endDate, mood, offset])

    // Distinct non-empty moods present in the current result set
    const availableMoods = Array.from(
        new Set(entries.map((e) => e.analysis?.mood).filter(Boolean) as string[])
    )

    const groups = groupByMonth(entries)

    return (
        <div className="mt-6" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {/* Search */}
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search entries..."
                className="rounded-2xl border border-sage-light/50 bg-white px-4 py-2 text-sm text-forest outline-none focus:border-sage w-full"
                style={{ fontFamily: 'var(--font-dm-sans)' }}
            />

            {/* Date range */}
            <div className="flex items-center gap-2 mt-3">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-sage-light/50 bg-white px-3 py-1.5 text-sm text-forest outline-none"
                />
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-xl border border-sage-light/50 bg-white px-3 py-1.5 text-sm text-forest outline-none"
                />
            </div>

            {/* Mood filter */}
            {availableMoods.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {availableMoods.map((m) => {
                        const active = mood === m
                        return (
                            <button
                                key={m}
                                onClick={() => setMood(active ? '' : m)}
                                className={`rounded-full px-3 py-1 text-xs font-medium ${active ? 'bg-sage text-white' : 'bg-white border border-sage-light/50 text-forest-muted'}`}
                            >
                                {m}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Results */}
            {loading && entries.length === 0 ? (
                <div className="mt-6 space-y-3">
                    {[0, 1, 2].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-sage-light/30 h-16 animate-pulse" />
                    ))}
                </div>
            ) : entries.length === 0 ? (
                <div className="mt-16 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center">
                        <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <p className="text-sm text-forest-muted">
                        No entries match your filters.
                    </p>
                </div>
            ) : (
                <div className="mt-6 space-y-8">
                    {groups.map(({ month, entries: monthEntries }) => (
                        <div key={month} className="space-y-3">
                            <span
                                className="text-xs font-semibold text-forest-muted tracking-widest uppercase"
                                style={{ fontFamily: 'var(--font-dm-sans)' }}
                            >
                                {month}
                            </span>
                            {monthEntries.map((entry) => (
                                <Link key={entry.id} href={`/journal/${entry.id}`}>
                                    <EntryCard entry={entry} />
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            {/* Load more */}
            {hasMore && (
                <div className="mt-8 flex justify-center">
                    <button
                        onClick={() => setOffset((prev) => prev + 50)}
                        disabled={loading}
                        className="bg-white border border-sage-light/50 text-forest-muted text-sm rounded-xl px-4 py-2"
                    >
                        {loading ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    )
}
