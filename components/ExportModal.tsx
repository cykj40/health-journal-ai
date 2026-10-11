'use client'

import { useState } from 'react'
import { ExportFormat } from '@/utils/exportUtils'

interface ExportField {
    key: string
    label: string
    checked: boolean
}

interface PDFOptions {
    orientation: 'portrait' | 'landscape'
    fontSize: number
    includeCharts: boolean
    theme: 'default' | 'minimal' | 'colorful'
}

interface ExportModalProps {
    isOpen: boolean
    onClose: () => void
    onExport: (
        format: ExportFormat,
        fields: ExportField[],
        pdfOptions?: PDFOptions
    ) => void
    data: any // This will be the analytics data
}

export default function ExportModal({
    isOpen,
    onClose,
    onExport,
    data,
}: ExportModalProps) {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
    const [fields, setFields] = useState<ExportField[]>([
        { key: 'date', label: 'Date', checked: true },
        { key: 'content', label: 'Content', checked: true },
        { key: 'mood', label: 'Mood', checked: true },
        { key: 'subject', label: 'Subject', checked: true },
        { key: 'sentimentScore', label: 'Sentiment Score', checked: true },
    ])
    const [pdfOptions, setPdfOptions] = useState<PDFOptions>({
        orientation: 'portrait',
        fontSize: 12,
        includeCharts: true,
        theme: 'default',
    })
    const [showPreview, setShowPreview] = useState(false)

    const handleFieldToggle = (key: string) => {
        setFields(
            fields.map((field) =>
                field.key === key ? { ...field, checked: !field.checked } : field
            )
        )
    }

    const handleExport = () => {
        onExport(
            selectedFormat,
            fields.filter((f) => f.checked),
            selectedFormat === 'pdf' ? pdfOptions : undefined
        )
        onClose()
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Export Options</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                {/* Format Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Export Format</h3>
                    <div className="flex gap-4">
                        {(['json', 'csv', 'pdf'] as ExportFormat[]).map((format) => (
                            <button
                                key={format}
                                onClick={() => setSelectedFormat(format)}
                                className={`px-4 py-2 rounded ${selectedFormat === format
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-100 hover:bg-gray-200'
                                    }`}
                            >
                                {format.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Field Selection */}
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Include Fields</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {fields.map((field) => (
                            <label
                                key={field.key}
                                className="flex items-center space-x-2"
                            >
                                <input
                                    type="checkbox"
                                    checked={field.checked}
                                    onChange={() => handleFieldToggle(field.key)}
                                    className="form-checkbox h-5 w-5 text-blue-500"
                                />
                                <span>{field.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* PDF Options */}
                {selectedFormat === 'pdf' && (
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-2">PDF Options</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Orientation
                                </label>
                                <select
                                    value={pdfOptions.orientation}
                                    onChange={(e) =>
                                        setPdfOptions({
                                            ...pdfOptions,
                                            orientation: e.target.value as 'portrait' | 'landscape',
                                        })
                                    }
                                    className="w-full border rounded-sm px-3 py-2"
                                >
                                    <option value="portrait">Portrait</option>
                                    <option value="landscape">Landscape</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">
                                    Font Size
                                </label>
                                <input
                                    type="number"
                                    value={pdfOptions.fontSize}
                                    onChange={(e) =>
                                        setPdfOptions({
                                            ...pdfOptions,
                                            fontSize: parseInt(e.target.value),
                                        })
                                    }
                                    min="8"
                                    max="16"
                                    className="w-full border rounded-sm px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Theme</label>
                                <select
                                    value={pdfOptions.theme}
                                    onChange={(e) =>
                                        setPdfOptions({
                                            ...pdfOptions,
                                            theme: e.target.value as PDFOptions['theme'],
                                        })
                                    }
                                    className="w-full border rounded-sm px-3 py-2"
                                >
                                    <option value="default">Default</option>
                                    <option value="minimal">Minimal</option>
                                    <option value="colorful">Colorful</option>
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={pdfOptions.includeCharts}
                                        onChange={(e) =>
                                            setPdfOptions({
                                                ...pdfOptions,
                                                includeCharts: e.target.checked,
                                            })
                                        }
                                        className="form-checkbox h-5 w-5 text-blue-500"
                                    />
                                    <span>Include Charts</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preview Toggle */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowPreview(!showPreview)}
                        className="text-blue-500 hover:text-blue-600"
                    >
                        {showPreview ? 'Hide Preview' : 'Show Preview'}
                    </button>
                </div>

                {/* Preview Section */}
                {showPreview && (
                    <div className="mb-6 border rounded-sm p-4 max-h-[300px] overflow-auto">
                        <h3 className="text-lg font-semibold mb-2">Preview</h3>
                        <pre className="text-sm">
                            {JSON.stringify(
                                {
                                    format: selectedFormat,
                                    fields: fields.filter((f) => f.checked),
                                    pdfOptions: selectedFormat === 'pdf' ? pdfOptions : undefined,
                                    sampleData: data.entries?.[0],
                                },
                                null,
                                2
                            )}
                        </pre>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 border rounded-sm hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 bg-blue-500 text-white rounded-sm hover:bg-blue-600"
                    >
                        Export
                    </button>
                </div>
            </div>
        </div>
    )
} 