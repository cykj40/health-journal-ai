'use client'

import { useState } from 'react'
import Spinner from './Spinner'

const AskAI = () => {
    const [query, setQuery] = useState('')
    const [answer, setAnswer] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await fetch('/api/question', {
                method: 'POST',
                body: JSON.stringify({ question: query }),
            })
            const data = await res.json()
            setAnswer(data.data)
            setQuery('')
        } catch (error) {
            console.error('Failed to get answer:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClear = () => {
        setAnswer('')
        setQuery('')
    }

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-xs">
            <form onSubmit={handleSubmit} className="p-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask about your journal entries (e.g., 'How has my mood been lately?')"
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        {isLoading ? <Spinner /> : 'Ask'}
                    </button>
                </div>
            </form>
            {answer && (
                <div className="p-4 border-t border-gray-100">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-700">AI Response:</h3>
                        <button
                            onClick={handleClear}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear
                        </button>
                    </div>
                    <p className="text-gray-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {answer}
                    </p>
                </div>
            )}
        </div>
    )
}

export default AskAI 