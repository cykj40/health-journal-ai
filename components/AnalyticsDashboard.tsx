'use client'

import { useMemo, useState, useRef } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts'
import DateRangeFilter, { TimeComparison } from './DateRangeFilter'
import {
    exportToJSON,
    exportToCSV,
    exportToPDF,
    ExportFormat,
    ExportField,
    PDFOptions,
} from '@/utils/exportUtils'
import ExportModal from './ExportModal'

type EntryWithAnalysis = {
    journal_entries: {
        id: string
        content: string
        createdAt: Date
    }
    entry_analysis: {
        mood: string
        subject: string
        sentimentScore: string
        color: string
    } | null
}

export type HealthMetricRow = {
    sleepQuality: string | null
    stressLevel: string | null
    energyLevel: string | null
    exerciseMentioned: boolean | null
    date: Date | string
}

interface AnalyticsDashboardProps {
    data: EntryWithAnalysis[]
    healthMetrics: HealthMetricRow[]
    startDate: Date
    endDate: Date
}

export default function AnalyticsDashboard({
    data,
    healthMetrics,
    startDate: initialStartDate,
    endDate: initialEndDate,
}: AnalyticsDashboardProps) {
    const [startDate, setStartDate] = useState<Date>(initialStartDate)
    const [endDate, setEndDate] = useState<Date>(initialEndDate)
    const [comparison, setComparison] = useState<TimeComparison>('none')

    // Process sentiment data for the line chart
    const sentimentData = useMemo(() => {
        return data.map((entry) => ({
            date: new Date(entry.journal_entries.createdAt).toLocaleDateString(),
            sentiment: entry.entry_analysis ? parseFloat(entry.entry_analysis.sentimentScore) : 0,
        })).reverse()
    }, [data])

    // Process mood data for the pie chart
    const moodData = useMemo(() => {
        const moodCounts = data.reduce((acc: { [key: string]: number }, entry) => {
            const mood = entry.entry_analysis?.mood || 'Unknown'
            acc[mood] = (acc[mood] || 0) + 1
            return acc
        }, {})

        return Object.entries(moodCounts).map(([name, value]) => ({
            name,
            value,
        }))
    }, [data])

    // Process subject data for the bar chart
    const subjectData = useMemo(() => {
        const subjectCounts = data.reduce((acc: { [key: string]: number }, entry) => {
            const subject = entry.entry_analysis?.subject || 'Unknown'
            acc[subject] = (acc[subject] || 0) + 1
            return acc
        }, {})

        return Object.entries(subjectCounts)
            .map(([name, value]) => ({
                name,
                count: value,
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)
    }, [data])

    const sleepData = useMemo(() => {
        return healthMetrics
            .map((m) => ({
                date: new Date(m.date).toLocaleDateString(),
                value: m.sleepQuality ? parseFloat(m.sleepQuality) : NaN,
            }))
            .filter((p) => Number.isFinite(p.value))
    }, [healthMetrics])

    const stressData = useMemo(() => {
        return healthMetrics
            .map((m) => ({
                date: new Date(m.date).toLocaleDateString(),
                value: m.stressLevel ? parseFloat(m.stressLevel) : NaN,
            }))
            .filter((p) => Number.isFinite(p.value))
    }, [healthMetrics])

    const energyData = useMemo(() => {
        return healthMetrics
            .map((m) => ({
                date: new Date(m.date).toLocaleDateString(),
                value: m.energyLevel ? parseFloat(m.energyLevel) : NaN,
            }))
            .filter((p) => Number.isFinite(p.value))
    }, [healthMetrics])

    const exerciseWeekly = useMemo(() => {
        const counts: Record<string, number> = {}
        for (const m of healthMetrics) {
            if (!m.exerciseMentioned) continue
            const d = new Date(m.date)
            const dayOfWeek = d.getDay()
            const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
            const weekStart = new Date(d)
            weekStart.setDate(d.getDate() + offsetToMonday)
            weekStart.setHours(0, 0, 0, 0)
            const key = weekStart.toLocaleDateString()
            counts[key] = (counts[key] || 0) + 1
        }
        return Object.entries(counts)
            .map(([week, count]) => ({ week, count }))
            .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime())
    }, [healthMetrics])

    const chartRefs = {
        sentiment: useRef<HTMLDivElement>(null),
        mood: useRef<HTMLDivElement>(null),
        subjects: useRef<HTMLDivElement>(null),
    }

    const [showExportModal, setShowExportModal] = useState(false)

    const handleExportWithOptions = async (
        format: ExportFormat,
        fields: ExportField[],
        pdfOptions?: PDFOptions
    ) => {
        const exportData = {
            entries: data.map((entry) => ({
                date: new Date(entry.journal_entries.createdAt).toLocaleDateString(),
                content: entry.journal_entries.content,
                mood: entry.entry_analysis?.mood || 'Unknown',
                subject: entry.entry_analysis?.subject || 'Unknown',
                sentimentScore: entry.entry_analysis?.sentimentScore || '0',
            })),
            summary: {
                totalEntries: data.length,
                averageSentiment: (
                    data.reduce(
                        (acc, entry) =>
                            acc + (entry.entry_analysis ? parseFloat(entry.entry_analysis.sentimentScore) : 0),
                        0
                    ) / data.length
                ).toFixed(1),
                mostCommonMood: moodData.length > 0
                    ? moodData.reduce((prev, current) =>
                        prev.value > current.value ? prev : current
                    ).name
                    : 'N/A',
            },
        }

        const dateRange = `${startDate.toISOString().split('T')[0]}-to-${endDate
            .toISOString()
            .split('T')[0]}`

        const chartElements = pdfOptions?.includeCharts
            ? Object.values(chartRefs)
                .map((ref) => ref.current)
                .filter((el): el is HTMLDivElement => el !== null)
            : undefined

        switch (format) {
            case 'json':
                exportToJSON(exportData, dateRange, fields)
                break
            case 'csv':
                exportToCSV(exportData, dateRange, fields)
                break
            case 'pdf':
                await exportToPDF(exportData, dateRange, fields, pdfOptions!, chartElements)
                break
        }
    }

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

    return (
        <div>
            <DateRangeFilter
                onRangeChange={(_range) => {
                    // Handle range change
                }}
                onDateChange={(start, end) => {
                    if (start && end) {
                        setStartDate(start)
                        setEndDate(end)
                    }
                }}
                onComparisonChange={setComparison}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Sentiment Trends */}
                <div className="bg-white p-6 rounded-lg shadow-md" ref={chartRefs.sentiment}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Sentiment Trends</h2>
                        {comparison !== 'none' && (
                            <div className="text-sm text-gray-500">
                                Comparing with previous {comparison}
                            </div>
                        )}
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sentimentData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis domain={[-10, 10]} />
                                <Tooltip />
                                <Legend />
                                <Line
                                    name="Current Period"
                                    type="monotone"
                                    dataKey="sentiment"
                                    stroke="#8884d8"
                                    strokeWidth={2}
                                />
                                {comparison !== 'none' && (
                                    <Line
                                        name="Previous Period"
                                        type="monotone"
                                        dataKey="previousSentiment"
                                        stroke="#82ca9d"
                                        strokeWidth={2}
                                        strokeDasharray="5 5"
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Mood Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-md" ref={chartRefs.mood}>
                    <h2 className="text-xl font-semibold mb-4">Mood Distribution</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={moodData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) =>
                                        `${name} (${(percent * 100).toFixed(0)}%)`
                                    }
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {moodData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Subjects */}
                <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2" ref={chartRefs.subjects}>
                    <h2 className="text-xl font-semibold mb-4">Most Common Subjects</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8">
                                    {subjectData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sleep Quality */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-sage-light/30">
                    <h2 className="text-xl font-semibold mb-4 text-forest">Sleep Quality</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sleepData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#C9D5B8" />
                                <XAxis dataKey="date" stroke="#3D4A3A" />
                                <YAxis domain={[1, 5]} stroke="#3D4A3A" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#5C7A52"
                                    strokeWidth={2}
                                    dot={{ fill: '#5C7A52' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Stress Level */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-sage-light/30">
                    <h2 className="text-xl font-semibold mb-4 text-forest">Stress Level</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stressData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#C9D5B8" />
                                <XAxis dataKey="date" stroke="#3D4A3A" />
                                <YAxis domain={[1, 5]} stroke="#3D4A3A" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#5C7A52"
                                    strokeWidth={2}
                                    dot={{ fill: '#5C7A52' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Energy Level */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-sage-light/30">
                    <h2 className="text-xl font-semibold mb-4 text-forest">Energy Level</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={energyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#C9D5B8" />
                                <XAxis dataKey="date" stroke="#3D4A3A" />
                                <YAxis domain={[1, 5]} stroke="#3D4A3A" />
                                <Tooltip />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#5C7A52"
                                    strokeWidth={2}
                                    dot={{ fill: '#5C7A52' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Exercise Frequency */}
                <div className="bg-white p-6 rounded-2xl shadow-xs border border-sage-light/30">
                    <h2 className="text-xl font-semibold mb-4 text-forest">Exercise Frequency</h2>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={exerciseWeekly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#C9D5B8" />
                                <XAxis dataKey="week" stroke="#3D4A3A" />
                                <YAxis stroke="#3D4A3A" allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#5C7A52" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Summary</h2>
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600 transition-colors"
                        >
                            Export Data
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-gray-600">Total Entries</p>
                            <p className="text-2xl font-bold">{data.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600">Average Sentiment</p>
                            <p className="text-2xl font-bold">
                                {(
                                    data.reduce(
                                        (acc, entry) =>
                                            acc + (entry.entry_analysis ? parseFloat(entry.entry_analysis.sentimentScore) : 0),
                                        0
                                    ) / data.length
                                ).toFixed(1)}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-gray-600">Most Common Mood</p>
                            <p className="text-2xl font-bold">
                                {moodData.length > 0
                                    ? moodData.reduce((prev, current) =>
                                        prev.value > current.value ? prev : current
                                    ).name
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                onExport={handleExportWithOptions}
                data={data}
            />
        </div>
    )
} 