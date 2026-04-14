'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type CalEvent = {
  id: string
  title: string
  date: string
  time: string
  description: string
  user_profile: string
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const [events, setEvents] = useState<CalEvent[]>([])
  const [viewDate, setViewDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', date: '', time: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    const { data } = await supabase.from('calendar_events').select('*').order('date')
    if (data) setEvents(data)
  }

  async function addEvent() {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    await supabase.from('calendar_events').insert({
      title: form.title,
      date: form.date,
      time: form.time,
      description: form.description,
      user_profile: 'mom',
    })
    setForm({ title: '', date: '', time: '', description: '' })
    setShowForm(false)
    setSaving(false)
    loadEvents()
  }

  async function deleteEvent(id: string) {
    if (!confirm('Delete this event?')) return
    await supabase.from('calendar_events').delete().eq('id', id)
    loadEvents()
  }

  // Build calendar grid
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`

  function eventsForDay(day: number) {
    const dateStr = `${monthStr}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  // Upcoming events (next 30 days)
  const upcomingCutoff = new Date(); upcomingCutoff.setDate(upcomingCutoff.getDate() + 30)
  const upcoming = events
    .filter(e => {
      const d = new Date(e.date)
      return d >= today && d <= upcomingCutoff
    })
    .slice(0, 5)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Calendar</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Family schedule and events</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add Event
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[var(--border)] p-5">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 hover:bg-[var(--surface-alt)] rounded-lg transition-colors">‹</button>
              <h2 className="font-bold text-[var(--text)]">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="p-2 hover:bg-[var(--surface-alt)] rounded-lg transition-colors">›</button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-xs font-semibold text-[var(--text-muted)] py-1">{d}</div>
              ))}
            </div>

            {/* Grid cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const dayEvents = eventsForDay(day)
                return (
                  <div
                    key={i}
                    className={`min-h-[60px] p-1 rounded-lg border transition-colors cursor-pointer hover:bg-[var(--surface-alt)] ${
                      isToday ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-transparent'
                    }`}
                    onClick={() => {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      setForm({ ...form, date: dateStr })
                      setShowForm(true)
                    }}
                  >
                    <div className={`text-xs font-semibold mb-1 text-right ${isToday ? 'text-[var(--accent)]' : 'text-[var(--text-sub)]'}`}>{day}</div>
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="text-[10px] bg-[var(--accent-soft)] text-[var(--accent)] rounded px-1 py-0.5 truncate mb-0.5">{ev.title}</div>
                    ))}
                    {dayEvents.length > 2 && <div className="text-[10px] text-[var(--text-muted)]">+{dayEvents.length - 2}</div>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Upcoming */}
          <div>
            <h3 className="font-semibold text-sm text-[var(--text)] mb-3">Upcoming</h3>
            <div className="space-y-2">
              {upcoming.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)] bg-white rounded-2xl border border-[var(--border)]">
                  <div className="text-2xl mb-2">📅</div>
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}
              {upcoming.map(ev => (
                <div key={ev.id} className="bg-white rounded-xl border border-[var(--border)] px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-[var(--text)] truncate">{ev.title}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {new Date(ev.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {ev.time && ` · ${ev.time}`}
                      </div>
                    </div>
                    <button onClick={() => deleteEvent(ev.id)} className="text-[var(--text-muted)] hover:text-red-500 text-sm">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Add event modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-[var(--text)]">New Event</h2>
                <button onClick={() => setShowForm(false)} className="text-[var(--text-muted)] hover:text-[var(--text)] text-xl">✕</button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Event title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="time"
                    value={form.time}
                    onChange={e => setForm({ ...form, time: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
                />
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={addEvent}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-[var(--surface-alt)] text-[var(--text-sub)] rounded-xl text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
