import { update } from '@/utils/actions'
import { getCurrentAppUser } from '@/utils/auth'
import { db } from '@/utils/db'
import { journalEntries, entryAnalysis } from '@/utils/schema'
import { NextResponse } from 'next/server'

export const POST = async (request: Request) => {
    const data = await request.json()
    const user = await getCurrentAppUser()

    // Create the journal entry first
    const [entry] = await db
        .insert(journalEntries)
        .values({
            content: data.content,
            userId: user.id,
            status: 'DRAFT'
        })
        .returning()

    // Create the initial analysis
    const [analysis] = await db
        .insert(entryAnalysis)
        .values({
            entryId: entry.id,
            userId: user.id,
            mood: '',
            subject: '',
            negative: false,
            summary: '',
            sentimentScore: '0',
            color: '#C9D5B8'
        })
        .returning()

    update(['/journal'])

    return NextResponse.json({ data: { ...entry, analysis } })
}
