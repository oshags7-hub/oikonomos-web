import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Parse this shopping list text into structured items. Return ONLY a JSON object with an "items" array. Each item: { "name": string, "quantity": string, "category": string }. Categories: Produce, Dairy, Meat, Bakery, Pantry, Frozen, Household, Other.\n\nText: "${text}"`,
      }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text
    const match = raw.match(/\{[\s\S]*\}/)
    const parsed = match ? JSON.parse(match[0]) : { items: [] }
    return NextResponse.json(parsed)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message, items: [] }, { status: 500 })
  }
}
