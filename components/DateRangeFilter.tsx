'use client'

import { useState } from 'react'

export type DateRange = '7d' | '30d' | '90d' | 'custom'
export type TimeComparison = 'week' | 'month' | 'none'

interface DateRangeFilterProps {
    onRangeChange: (range: DateRange) => void
    onDateChange: (startDate: Date | null, endDate: Date | null) => void
    onComparisonChange: (comparison: TimeComparison) => void
}

export default function DateRangeFilter({
    onRangeChange,
    onDateChange,
    onComparisonChange,
}: DateRangeFilterProps) {
    const [selectedRange, setSelectedRange] = useState<DateRange>('30d')
    const [comparison, setComparison] = useState<TimeComparison>('none')
    const [startDate, setStartDate] = useState<string>('')
    const [endDate, setEndDate] = useState<string>('')

    const handleRangeChange = (range: DateRange) => {
        setSelectedRange(range)
        onRangeChange(range)

        if (range !== 'custom') {
            const end = new Date()
            const start = new Date()

            switch (range) {
                case '7d':
                    start.setDate(end.getDate() - 7)
                    break
                case '30d':
                    start.setDate(end.getDate() - 30)
                    break
                case '90d':
                    start.setDate(end.getDate() - 90)
                    break
            }

            onDateChange(start, end)
            setStartDate(start.toISOString().split('T')[0])
            setEndDate(end.toISOString().split('T')[0])
        }
    }

    const handleCustomDateChange = (start: string, end: string) => {
        setStartDate(start)
        setEndDate(end)
        onDateChange(start ? new Date(start) : null, end ? new Date(end) : null)
    }

    const handleComparisonChange = (newComparison: TimeComparison) => {
        setComparison(newComparison)
        onComparisonChange(newComparison)
    }

    return (
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-md mb-8">
            <div className="flex gap-2">
                <button
                    onClick={() => handleRangeChange('7d')}
                    className={`px-3 py-1 rounded ${selectedRange === '7d'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    7 Days
                </button>
                <button
                    onClick={() => handleRangeChange('30d')}
                    className={`px-3 py-1 rounded ${selectedRange === '30d'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    30 Days
                </button>
                <button
                    onClick={() => handleRangeChange('90d')}
                    className={`px-3 py-1 rounded ${selectedRange === '90d'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    90 Days
                </button>
                <button
                    onClick={() => handleRangeChange('custom')}
                    className={`px-3 py-1 rounded ${selectedRange === 'custom'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                >
                    Custom
                </button>
            </div>

            {selectedRange === 'custom' && (
                <div className="flex gap-2">
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => handleCustomDateChange(e.target.value, endDate)}
                        className="border rounded-sm px-2 py-1"
                    />
                    <span>to</span>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => handleCustomDateChange(startDate, e.target.value)}
                        className="border rounded-sm px-2 py-1"
                    />
                </div>
            )}

            <div className="flex gap-2 ml-4 border-l pl-4">
                <span className="text-gray-600">Compare:</span>
                <select
                    value={comparison}
                    onChange={(e) => handleComparisonChange(e.target.value as TimeComparison)}
                    className="border rounded-sm px-2 py-1"
                >
                    <option value="none">No Comparison</option>
                    <option value="week">Previous Week</option>
                    <option value="month">Previous Month</option>
                </select>
            </div>
        </div>
    )
} 