'use client'

import { type Entry } from '@/utils/types'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import EntryCard from '@/components/EntryCard'

const groupEntriesByMonth = (entries: Entry[]) => {
    return entries.reduce<Record<string, Entry[]>>((acc, entry) => {
        const date = new Date(entry.createdAt)
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' })

        if (!acc[monthYear]) {
            acc[monthYear] = []
        }
        acc[monthYear].push(entry)
        return acc
    }, {})
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

    // Distinct moods present in the current result set
    const availableMoods = Array.from(
        new Set(entries.map((e) => e.analysis?.mood).filter(Boolean) as string[])
    )

    const entriesByMonth = groupEntriesByMonth(entries)

    return (
        <div style={{ fontFamily: 'var(--font-dm-sans)' }}>
            {/* Search */}
            <input
                type="text"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search entries..."
                className="w-full bg-white rounded-2xl border border-sage-light/30 shadow-sm px-4 py-3 text-sm text-forest placeholder:text-forest-muted outline-none mb-4"
            />

            {/* Date range */}
            <div className="flex items-center gap-2 mb-4">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border border-sage text-forest rounded-lg px-2 py-1 text-sm outline-none"
                />
                <span className="text-forest-muted text-sm">to</span>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border border-sage text-forest rounded-lg px-2 py-1 text-sm outline-none"
                />
            </div>

            {/* Mood filter */}
            {availableMoods.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-8">
                    {availableMoods.map((m) => {
                        const active = mood === m
                        return (
                            <button
                                key={m}
                                onClick={() => setMood(active ? '' : m)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors ${active ? 'bg-sage text-white' : 'bg-sage-light text-forest'}`}
                            >
                                {m}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Results */}
            {entries.length === 0 && !loading ? (
                <div className="mt-16 flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-sage-light flex items-center justify-center">
                        <svg className="w-5 h-5 text-sage" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                    </div>
                    <p className="text-sm text-forest-muted text-center">
                        No entries match your filters
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.entries(entriesByMonth).map(([monthYear, monthEntries]) => (
                        <div key={monthYear}>
                            <h2 className="text-2xl font-semibold mb-4">{monthYear}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {monthEntries.map((entry) => (
                                    <Link key={entry.id} href={`/journal/${entry.id}`}>
                                        <EntryCard entry={entry} />
                                    </Link>
                                ))}
                            </div>
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
                        className="px-4 py-1.5 rounded-xl bg-[#5C7A52] text-white text-xs font-medium hover:bg-[#3D4A3A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Loading…' : 'Load more'}
                    </button>
                </div>
            )}
        </div>
    )
}
