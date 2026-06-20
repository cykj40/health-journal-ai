import { getCurrentAppUser } from '@/utils/auth'
import { db } from '@/utils/db'
import { journalEntries, entryAnalysis } from '@/utils/schema'
import { eq, and, between, desc, ilike } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export const GET = async (request: NextRequest) => {
    try {
        const searchParams = request.nextUrl.searchParams
        const q = searchParams.get('q')
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const mood = searchParams.get('mood')
        const offset = Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0

        const user = await getCurrentAppUser()

        const conditions = [eq(journalEntries.userId, user.id)]

        if (q) {
            conditions.push(ilike(journalEntries.content, `%${q}%`))
        }

        if (startDate && endDate) {
            conditions.push(between(journalEntries.createdAt, new Date(startDate), new Date(endDate)))
        }

        if (mood) {
            conditions.push(eq(entryAnalysis.mood, mood))
        }

        const rows = await db
            .select()
            .from(journalEntries)
            .leftJoin(entryAnalysis, eq(journalEntries.id, entryAnalysis.entryId))
            .where(and(...conditions))
            .orderBy(desc(journalEntries.createdAt))
            .limit(50)
            .offset(offset)

        const entries = rows.map(entry => ({
            id: entry.journal_entries.id,
            content: entry.journal_entries.content,
            createdAt: entry.journal_entries.createdAt.toISOString(),
            updatedAt: entry.journal_entries.updatedAt.toISOString(),
            userId: entry.journal_entries.userId,
            status: entry.journal_entries.status,
            analysis: entry.entry_analysis ? {
                mood: entry.entry_analysis.mood,
                subject: entry.entry_analysis.subject,
                negative: entry.entry_analysis.negative,
                summary: entry.entry_analysis.summary,
                color: entry.entry_analysis.color || '#C9D5B8',
                sentimentScore: parseFloat(entry.entry_analysis.sentimentScore),
                lanceScore: entry.entry_analysis.balanceScore != null ? parseFloat(entry.entry_analysis.balanceScore) : undefined,
                coachingInsight: entry.entry_analysis.coachingInsight ?? undefined,
                coachingRecommendation: entry.entry_analysis.coachingRecommendation ?? undefined,
            } : {
                mood: '',
                subject: '',
                negative: false,
                summary: '',
                color: '#C9D5B8',
                sentimentScore: 0,
            },
        }))

        return NextResponse.json({ data: entries, hasMore: entries.length === 50 })
    } catch (error) {
        console.error('Error fetching entries:', error)
        return NextResponse.json(
            { error: 'Failed to fetch entries' },
            { status: 500 }
        )
    }
}
