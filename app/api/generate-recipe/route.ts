import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Create a recipe for: "${prompt}". Return ONLY a JSON object with these fields: { "title": string, "prep_time": string, "ingredients": string (newline-separated list), "instructions": string (numbered steps, newline-separated) }`,
      }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text
    const match = raw.match(/\{[\s\S]*\}/)
    const recipe = match ? JSON.parse(match[0]) : { title: prompt, prep_time: '', ingredients: '', instructions: '' }
    return NextResponse.json(recipe)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
