import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { childName, grade } = await req.json()

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Create a homeschool weekly plan for ${childName}${grade ? ` (${grade} grade)` : ''}. Return ONLY a JSON object with a "lessons" array. Each lesson: { "day": "Monday"|"Tuesday"|"Wednesday"|"Thursday"|"Friday", "subject": string, "description": string }. Include 4-5 lessons per day covering: Math, Reading, Writing, Science, History, and optionally Art or Bible.`,
    }],
  })

  const raw = (msg.content[0] as { type: string; text: string }).text
  const match = raw.match(/\{[\s\S]*\}/)
  const plan = match ? JSON.parse(match[0]) : { lessons: [] }
  return NextResponse.json(plan)
}
