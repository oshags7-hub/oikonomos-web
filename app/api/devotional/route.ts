import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { verse } = await req.json()

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
}
