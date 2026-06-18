import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

export type ExportFormat = 'json' | 'csv' | 'pdf'

export interface ExportField {
    key: string
    label: string
    checked: boolean
}

export interface PDFOptions {
    orientation: 'portrait' | 'landscape'
    fontSize: number
    includeCharts: boolean
    theme: 'default' | 'minimal' | 'colorful'
}

interface AnalyticsEntry {
    date: string
    content: string
    mood: string
    subject: string
    sentimentScore: string
}

interface AnalyticsSummary {
    totalEntries: number
    averageSentiment: string
    mostCommonMood: string
}

interface ExportData {
    entries: AnalyticsEntry[]
    summary: AnalyticsSummary
}

type ColorTuple = [number, number, number]

interface ThemeConfig {
    headerColor: ColorTuple
    rowEvenColor: ColorTuple
    rowOddColor: ColorTuple
    textColor: ColorTuple
}

const themeConfigs: Record<PDFOptions['theme'], ThemeConfig> = {
    default: {
        headerColor: [66, 139, 202],
        rowEvenColor: [245, 245, 245],
        rowOddColor: [255, 255, 255],
        textColor: [0, 0, 0],
    },
    minimal: {
        headerColor: [80, 80, 80],
        rowEvenColor: [255, 255, 255],
        rowOddColor: [250, 250, 250],
        textColor: [60, 60, 60],
    },
    colorful: {
        headerColor: [75, 119, 190],
        rowEvenColor: [237, 242, 247],
        rowOddColor: [255, 255, 255],
        textColor: [45, 55, 72],
    },
}

// Extend jsPDF type to include lastAutoTable
declare module 'jspdf' {
    interface jsPDF {
        lastAutoTable?: {
            finalY: number
        }
    }
}

export const exportToJSON = (
    data: ExportData,
    dateRange: string,
    selectedFields: ExportField[]
): void => {
    const filteredData = {
        entries: data.entries.map((entry) => {
            const filteredEntry: Partial<AnalyticsEntry> = {}
            selectedFields.forEach((field) => {
                if (field.checked) {
                    filteredEntry[field.key as keyof AnalyticsEntry] = entry[field.key as keyof AnalyticsEntry]
                }
            })
            return filteredEntry
        }),
        summary: data.summary,
    }

    const blob = new Blob([JSON.stringify(filteredData, null, 2)], {
        type: 'application/json',
    })
    downloadFile(blob, `journal-analytics-${dateRange}.json`)
}

export const exportToCSV = (
    data: ExportData,
    dateRange: string,
    selectedFields: ExportField[]
): void => {
    // Create CSV header
    const headers = selectedFields
        .filter((field) => field.checked)
        .map((field) => field.label)

    // Convert entries to CSV rows
    const rows = data.entries.map((entry) =>
        selectedFields
            .filter((field) => field.checked)
            .map((field) => {
                const value = entry[field.key as keyof AnalyticsEntry]
                return field.key === 'content'
                    ? `"${value.replace(/"/g, '""')}"`
                    : value
            })
    )

    // Add summary section
    const summaryRows = [
        Array(headers.length).fill(''),
        ['Summary', ...Array(headers.length - 1).fill('')],
        [
            'Total Entries',
            data.summary.totalEntries.toString(),
            ...Array(headers.length - 2).fill(''),
        ],
        [
            'Average Sentiment',
            data.summary.averageSentiment,
            ...Array(headers.length - 2).fill(''),
        ],
        [
            'Most Common Mood',
            data.summary.mostCommonMood,
            ...Array(headers.length - 2).fill(''),
        ],
    ]

    // Combine all rows
    const csvContent = [headers, ...rows, ...summaryRows]
        .map((row) => row.join(','))
        .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `journal-analytics-${dateRange}.csv`)
}

export const exportToPDF = async (
    data: ExportData,
    dateRange: string,
    selectedFields: ExportField[],
    pdfOptions: PDFOptions,
    chartElements?: HTMLElement[]
): Promise<void> => {
    const theme = themeConfigs[pdfOptions.theme]
    const doc = new jsPDF({
        orientation: pdfOptions.orientation,
        unit: 'pt',
    })

    // Set font size
    doc.setFontSize(pdfOptions.fontSize + 4)
    doc.text('Journal Analytics Report', 40, 40)
    doc.setFontSize(pdfOptions.fontSize)
    doc.text(`Date Range: ${dateRange}`, 40, 70)

    // Add summary section
    doc.setFontSize(pdfOptions.fontSize + 2)
    doc.text('Summary', 40, 100)
    doc.setFontSize(pdfOptions.fontSize)

    const summaryData = [
        ['Total Entries', data.summary.totalEntries.toString()],
        ['Average Sentiment', data.summary.averageSentiment],
        ['Most Common Mood', data.summary.mostCommonMood],
    ]

    autoTable(doc, {
        startY: 120,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'grid',
        headStyles: {
            fillColor: theme.headerColor,
            fontSize: pdfOptions.fontSize,
        },
        alternateRowStyles: {
            fillColor: theme.rowEvenColor,
        },
        styles: {
            textColor: theme.textColor,
            fontSize: pdfOptions.fontSize,
        },
    })

    // Add charts if requested
    if (pdfOptions.includeCharts && chartElements) {
        let yPosition = doc.lastAutoTable?.finalY || 120
        yPosition += 40

        for (const chart of chartElements) {
            const canvas = await html2canvas(chart)
            const imgData = canvas.toDataURL('image/png')
            const imgWidth = pdfOptions.orientation === 'portrait' ? 500 : 750
            const imgHeight = (canvas.height * imgWidth) / canvas.width

            if (yPosition + imgHeight > doc.internal.pageSize.height - 40) {
                doc.addPage()
                yPosition = 40
            }

            doc.addImage(imgData, 'PNG', 40, yPosition, imgWidth, imgHeight)
            yPosition += imgHeight + 40
        }
    }

    // Add entries table
    doc.addPage()
    doc.setFontSize(pdfOptions.fontSize + 2)
    doc.text('Journal Entries', 40, 40)

    const headers = selectedFields
        .filter((field) => field.checked)
        .map((field) => field.label)

    const entriesData = data.entries.map((entry) =>
        selectedFields
            .filter((field) => field.checked)
            .map((field) => {
                const value = entry[field.key as keyof AnalyticsEntry]
                return field.key === 'content' && value.length > 100
                    ? value.substring(0, 100) + '...'
                    : value
            })
    )

    autoTable(doc, {
        startY: 60,
        head: [headers],
        body: entriesData,
        theme: 'grid',
        headStyles: {
            fillColor: theme.headerColor,
            fontSize: pdfOptions.fontSize,
        },
        alternateRowStyles: {
            fillColor: theme.rowEvenColor,
        },
        styles: {
            textColor: theme.textColor,
            fontSize: pdfOptions.fontSize,
            cellWidth: 'auto',
        },
    })

    doc.save(`journal-analytics-${dateRange}.pdf`)
}

export const downloadFile = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
} 