import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export async function POST(req: NextRequest) {
  try {
    const { verse } = await req.json()
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [{
        role: 'user',
        content: `Write a short, warm family devotional (3-4 sentences) based on ${verse || 'a uplifting Bible verse of your choice'}. Include the verse text, a brief reflection, and a simple application for the day. Return ONLY a JSON object: { "devotional": string }`,
      }],
    })

    const raw = (msg.content[0] as { type: string; text: string }).text
    const match = raw.match(/\{[\s\S]*\}/)
    const result = match ? JSON.parse(match[0]) : { devotional: raw }
    return NextResponse.json(result)
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: message, devotional: '' }, { status: 500 })
  }
}
