import Anthropic from '@anthropic-ai/sdk'
import { anthropic as anthropicProvider } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY!,
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type EntryAnalysis = {
    // Core mood
    mood: string
    subject: string
    negative: boolean
    summary: string
    color: string
    sentimentScore: number

    // Mental / cognitive
    moodStability: 'stable' | 'variable' | 'crashed'
    anxietyLevel: number | null        // 1–5
    motivationLevel: number | null     // 1–5
    gratitudeMentioned: boolean
    socialConnection: 'isolated' | 'neutral' | 'connected' | null

    // Energy & stress
    energyLevel: number | null         // 1–5
    stressLevel: number | null         // 1–5
    workStress: boolean
    workStressSeverity: number | null  // 1–5

    // Sleep
    sleepQuality: number | null        // 1–5

    // Exercise & movement
    exerciseMentioned: boolean
    exerciseType: string | null
    exerciseDuration: string | null
    exerciseIntensity: 'low' | 'medium' | 'high' | null
    stretchingMobility: boolean
    restDayMentioned: boolean

    // Nutrition & substances
    nutritionMentioned: boolean
    nutritionSummary: string | null
    foodLogged: string[]
    waterIntake: string | null
    alcoholMentioned: boolean
    caffeineNoted: boolean

    // Physical body
    physicalSymptoms: string[]
    painLevel: number | null           // 0–10
    painLocation: string[]
    heartRateNoted: boolean
    digestionNoted: boolean
    digestionNotes: string | null
    skinNoted: boolean
    cycleNoted: boolean

    // Environment & recovery
    sunExposure: boolean
    outdoorTime: boolean
    coldExposure: boolean
    breathworkMeditation: boolean
    travelMentioned: boolean
    naturalEnvironment: boolean
    screenTimeNoted: boolean

    // Medications & supplements
    medicationsMentioned: string[]

    // Summary flags
    healthFlags: string[]
}

// ── analyzeEntry ──────────────────────────────────────────────────────────────

const EntryAnalysisSchema = z.object({
    mood: z.string(),
    subject: z.string(),
    negative: z.boolean(),
    summary: z.string(),
    color: z.string(),
    sentimentScore: z.number(),
    moodStability: z.enum(['stable', 'variable', 'crashed']),
    anxietyLevel: z.number().nullable(),
    motivationLevel: z.number().nullable(),
    gratitudeMentioned: z.boolean(),
    socialConnection: z.enum(['isolated', 'neutral', 'connected']).nullable(),
    energyLevel: z.number().nullable(),
    stressLevel: z.number().nullable(),
    workStress: z.boolean(),
    workStressSeverity: z.number().nullable(),
    sleepQuality: z.number().nullable(),
    exerciseMentioned: z.boolean(),
    exerciseType: z.string().nullable(),
    exerciseDuration: z.string().nullable(),
    exerciseIntensity: z.enum(['low', 'medium', 'high']).nullable(),
    stretchingMobility: z.boolean(),
    restDayMentioned: z.boolean(),
    nutritionMentioned: z.boolean(),
    nutritionSummary: z.string().nullable(),
    foodLogged: z.array(z.string()),
    waterIntake: z.string().nullable(),
    alcoholMentioned: z.boolean(),
    caffeineNoted: z.boolean(),
    physicalSymptoms: z.array(z.string()),
    painLevel: z.number().nullable(),
    painLocation: z.array(z.string()),
    heartRateNoted: z.boolean(),
    digestionNoted: z.boolean(),
    digestionNotes: z.string().nullable(),
    skinNoted: z.boolean(),
    cycleNoted: z.boolean(),
    sunExposure: z.boolean(),
    outdoorTime: z.boolean(),
    coldExposure: z.boolean(),
    breathworkMeditation: z.boolean(),
    travelMentioned: z.boolean(),
    naturalEnvironment: z.boolean(),
    screenTimeNoted: z.boolean(),
    medicationsMentioned: z.array(z.string()),
    healthFlags: z.array(z.string()),
})

export const analyzeEntry = async (entry: { id: string; content: string }): Promise<EntryAnalysis> => {
    const { object } = await generateObject({
        model: anthropicProvider('claude-sonnet-4-5'),
        schema: EntryAnalysisSchema,
        system: `You are a health and wellness journal analyst. Extract emotional and physical health signals from journal entries. For color: use a hex that reflects mood — greens (#5C7A52, #4CAF50) for positive/calm, yellows (#F59E0B) for neutral/mixed, reds (#E57373, #EF5350) for stress/negative. For sentimentScore: -10 (very negative) to 10 (very positive). Be precise and evidence-based — only mark fields true if the entry actually mentions them.`,
        prompt: `Analyze this journal entry and extract all health signals:\n\n${entry.content}`,
    })
    return object
}

// ── qa ────────────────────────────────────────────────────────────────────────

export const qa = async (
    question: string,
    entries: { id: string; content: string; createdAt: Date }[],
    similarEntries?: string[]
): Promise<string> => {
    const context = similarEntries && similarEntries.length > 0
        ? similarEntries.join('\n\n---\n\n')
        : entries
            .slice(-20)
            .map(e => `[${e.createdAt.toISOString().slice(0, 10)}]\n${e.content}`)
            .join('\n\n---\n\n')

    const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `You are a health and mood journal coach. Answer questions about mood, energy, stress, sleep, and physical symptoms based on the journal entries provided. Keep answers concise — 2-3 sentences max unless more detail is clearly needed.

Journal entries:
${context}

User question: ${question}`,
            },
        ],
    })

    return message.content[0].type === 'text' ? message.content[0].text : 'Unable to generate response.'
}

// ── generateBalanceInsight ────────────────────────────────────────────────────

const BalanceInsightSchema = z.object({
    score: z.number().int().min(0).max(100),
    insight: z.string(),
    recommendation: z.string(),
})

export const generateBalanceInsight = async (
    metrics: Array<Record<string, unknown>>,
    journalEntryContent: string
): Promise<{ score: number; insight: string; recommendation: string }> => {
    const { object } = await generateObject({
        model: anthropicProvider('claude-sonnet-4-5'),
        schema: BalanceInsightSchema,
        system: `You are a health balance coach. Analyze this journal entry AND any available health metrics. If metrics are empty, infer health signals directly from the journal text. Return a score (0-100 representing overall life balance — higher means more balanced across exercise, nutrition, sleep, social connection, mental health, stress management), an insight (1-2 sentences describing the main pattern), and a recommendation (1 specific actionable suggestion to improve balance). Be direct and concrete, not generic. Never dismiss the user for missing data if the journal entry contains any text.`,
        prompt: `Analyze this journal entry AND any available health metrics. If metrics are empty, infer health signals directly from the journal text.

Journal entry (HTML or plain text is fine):
${journalEntryContent.trim() || '(No entry text)'}

Recent health metrics (may be empty or partial):
${JSON.stringify(metrics)}`,
    })

    return object
}
