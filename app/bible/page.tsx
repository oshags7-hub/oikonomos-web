'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Note = { id: string; verse: string; text: string; created_at: string }

export default function BiblePage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [verse, setVerse] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [devotional, setDevotional] = useState('')
  const [devotionalLoading, setDevotionalLoading] = useState(false)

  useEffect(() => { loadNotes() }, [])

  async function loadNotes() {
    const { data } = await supabase.from('bible_notes').select('*').order('created_at', { ascending: false })
    if (data) setNotes(data)
  }

  async function addNote() {
    if (!text.trim()) return
    setSaving(true)
    await supabase.from('bible_notes').insert({ verse, text, user_profile: 'mom' })
    setVerse('')
    setText('')
    setSaving(false)
    loadNotes()
  }

  async function deleteNote(id: string) {
    if (!confirm('Delete this note?')) return
    await supabase.from('bible_notes').delete().eq('id', id)
    loadNotes()
  }

  async function generateDevotional() {
    setDevotionalLoading(true)
    try {
      const res = await fetch('/api/devotional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verse }),
      })
      const data = await res.json()
      setDevotional(data.devotional)
    } catch {
      alert('Failed to generate devotional')
    }
    setDevotionalLoading(false)
  }

  return (
    <AppShell>
      <div className="p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)]">Bible</h1>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">Verses, notes, and daily devotionals</p>
        </div>

        {/* AI Devotional */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-6">
          <div className="text-sm font-semibold text-[var(--text)] mb-1">✦ Daily Devotional</div>
          <p className="text-xs text-[var(--text-muted)] mb-3">Enter a verse reference for an AI-generated devotional</p>
          <div className="flex gap-2 mb-3">
            <input
              value={verse}
              onChange={e => setVerse(e.target.value)}
              placeholder="e.g. John 3:16 or Psalm 23"
              className="flex-1 px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={generateDevotional}
              disabled={devotionalLoading || !verse.trim()}
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {devotionalLoading ? 'Generating...' : 'Generate'}
            </button>
          </div>
          {devotional && (
            <div className="bg-[var(--bg)] rounded-xl p-4 text-sm text-[var(--text-sub)] leading-relaxed">
              {devotional}
            </div>
          )}
        </div>

        {/* Add note */}
        <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-6">
          <div className="text-sm font-semibold text-[var(--text)] mb-3">Add Note</div>
          <div className="space-y-3">
            <input
              value={verse}
              onChange={e => setVerse(e.target.value)}
              placeholder="Verse reference (optional)"
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Your thoughts, reflections, or notes..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
            />
          </div>
          <button
            onClick={addNote}
            disabled={saving || !text.trim()}
            className="mt-3 px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-3">
          {notes.length === 0 && (
            <div className="text-center py-12 text-[var(--text-muted)]">
              <div className="text-4xl mb-3">📖</div>
              <p className="font-medium">No notes yet</p>
            </div>
          )}
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-xl border border-[var(--border)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {note.verse && (
                    <div className="text-xs font-semibold text-[var(--accent)] mb-1.5">{note.verse}</div>
                  )}
                  <p className="text-sm text-[var(--text-sub)] leading-relaxed">{note.text}</p>
                  <div className="text-xs text-[var(--text-muted)] mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={() => deleteNote(note.id)} className="text-[var(--text-muted)] hover:text-red-500 text-sm shrink-0">✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
