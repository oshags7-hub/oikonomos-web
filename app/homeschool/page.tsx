'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Child = { id: string; name: string; grade: string; user_profile: string }
type Lesson = { id: string; child_id: string; day: string; subject: string; description: string; completed: boolean }

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const SUBJECTS = ['Math', 'Reading', 'Writing', 'Science', 'History', 'Art', 'Music', 'PE', 'Bible', 'Other']

export default function HomeschoolPage() {
  const [children, setChildren] = useState<Child[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [selectedChild, setSelectedChild] = useState<string | null>(null)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [showChildForm, setShowChildForm] = useState(false)
  const [showLessonForm, setShowLessonForm] = useState(false)
  const [childForm, setChildForm] = useState({ name: '', grade: '' })
  const [lessonForm, setLessonForm] = useState({ subject: 'Math', description: '' })
  const [saving, setSaving] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => { loadChildren() }, [])
  useEffect(() => { if (selectedChild) loadLessons() }, [selectedChild])

  async function loadChildren() {
    const { data } = await supabase.from('children').select('*').order('name')
    if (data) {
      setChildren(data)
      if (data.length > 0 && !selectedChild) setSelectedChild(data[0].id)
    }
  }

  async function loadLessons() {
    if (!selectedChild) return
    const { data } = await supabase.from('lessons').select('*').eq('child_id', selectedChild)
    if (data) setLessons(data)
  }

  async function addChild() {
    if (!childForm.name.trim()) return
    setSaving(true)
    const { data } = await supabase.from('children').insert({
      name: childForm.name,
      grade: childForm.grade,
      user_profile: 'mom',
    }).select().single()
    setChildForm({ name: '', grade: '' })
    setShowChildForm(false)
    setSaving(false)
    await loadChildren()
    if (data) setSelectedChild(data.id)
  }

  async function addLesson() {
    if (!selectedChild || !lessonForm.subject) return
    setSaving(true)
    await supabase.from('lessons').insert({
      child_id: selectedChild,
      day: selectedDay,
      subject: lessonForm.subject,
      description: lessonForm.description,
      completed: false,
    })
    setLessonForm({ subject: 'Math', description: '' })
    setShowLessonForm(false)
    setSaving(false)
    loadLessons()
  }

  async function toggleLesson(lesson: Lesson) {
    await supabase.from('lessons').update({ completed: !lesson.completed }).eq('id', lesson.id)
    loadLessons()
  }

  async function deleteLesson(id: string) {
    await supabase.from('lessons').delete().eq('id', id)
    loadLessons()
  }

  async function aiPlanWeek() {
    if (!selectedChild) return
    const child = children.find(c => c.id === selectedChild)
    if (!child) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/plan-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: child.name, grade: child.grade }),
      })
      const plan = await res.json()
      for (const lesson of plan.lessons ?? []) {
        await supabase.from('lessons').insert({
          child_id: selectedChild,
          day: lesson.day,
          subject: lesson.subject,
          description: lesson.description,
          completed: false,
        })
      }
      loadLessons()
    } catch {
      alert('AI planning failed')
    }
    setAiLoading(false)
  }

  const dayLessons = lessons.filter(l => l.day === selectedDay)
  const currentChild = children.find(c => c.id === selectedChild)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Homeschool</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Weekly planner for each child</p>
          </div>
          <button
            onClick={() => setShowChildForm(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90"
          >
            + Add Child
          </button>
        </div>

        {/* Add child form */}
        {showChildForm && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">Add Child</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Child's name"
                value={childForm.name}
                onChange={e => setChildForm({ ...childForm, name: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                placeholder="Grade (e.g. 3rd)"
                value={childForm.grade}
                onChange={e => setChildForm({ ...childForm, grade: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={addChild} disabled={saving} className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Child'}
              </button>
              <button onClick={() => setShowChildForm(false)} className="px-4 py-2 bg-[var(--surface-alt)] text-[var(--text-sub)] rounded-xl text-sm font-semibold">Cancel</button>
            </div>
          </div>
        )}

        {children.length === 0 ? (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <div className="text-4xl mb-3">✏️</div>
            <p className="font-medium">No children added yet</p>
            <p className="text-sm mt-1">Add a child to start planning their week</p>
          </div>
        ) : (
          <div>
            {/* Child tabs */}
            <div className="flex gap-2 mb-5 flex-wrap">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    selectedChild === child.id
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-white border border-[var(--border)] text-[var(--text-sub)] hover:border-[var(--accent)]'
                  }`}
                >
                  {child.name}
                  {child.grade && <span className="ml-1.5 opacity-70 text-xs">{child.grade}</span>}
                </button>
              ))}
            </div>

            {/* AI Plan Week */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-[var(--border)] px-5 py-4 mb-5">
              <div>
                <div className="font-semibold text-sm text-[var(--text)]">✦ AI Plan Week</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">Auto-generate a full week of lessons for {currentChild?.name}</div>
              </div>
              <button
                onClick={aiPlanWeek}
                disabled={aiLoading}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {aiLoading ? 'Planning...' : 'Plan Week'}
              </button>
            </div>

            {/* Day selector */}
            <div className="flex gap-1.5 mb-4 overflow-x-auto">
              {DAYS.map(day => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                    selectedDay === day
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'bg-white border border-[var(--border)] text-[var(--text-sub)]'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Add lesson */}
            {showLessonForm ? (
              <div className="bg-white rounded-2xl border border-[var(--border)] p-4 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={lessonForm.subject}
                    onChange={e => setLessonForm({ ...lessonForm, subject: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <input
                    placeholder="Description"
                    value={lessonForm.description}
                    onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={addLesson} disabled={saving} className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                    {saving ? 'Saving...' : 'Add'}
                  </button>
                  <button onClick={() => setShowLessonForm(false)} className="px-4 py-2 bg-[var(--surface-alt)] text-[var(--text-sub)] rounded-xl text-sm font-semibold">Cancel</button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLessonForm(true)}
                className="w-full py-2.5 border border-dashed border-[var(--border)] rounded-xl text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors mb-4"
              >
                + Add lesson for {selectedDay}
              </button>
            )}

            {/* Lessons for selected day */}
            <div className="space-y-2">
              {dayLessons.length === 0 && (
                <div className="text-center py-8 text-[var(--text-muted)]">
                  <p className="text-sm">No lessons for {selectedDay}</p>
                </div>
              )}
              {dayLessons.map(lesson => (
                <div key={lesson.id} className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={lesson.completed}
                    onChange={() => toggleLesson(lesson)}
                    className="w-4 h-4 accent-[var(--accent)]"
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`font-semibold text-sm ${lesson.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text)]'}`}>
                      {lesson.subject}
                    </div>
                    {lesson.description && (
                      <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{lesson.description}</div>
                    )}
                  </div>
                  <button onClick={() => deleteLesson(lesson.id)} className="text-[var(--text-muted)] hover:text-red-500 text-sm">✕</button>
                </div>
              ))}
            </div>

            {/* Week at a glance */}
            {lessons.length > 0 && (
              <div className="mt-8">
                <h3 className="font-semibold text-sm text-[var(--text)] mb-3">Week at a Glance</h3>
                <div className="grid grid-cols-5 gap-2">
                  {DAYS.map(day => {
                    const dl = lessons.filter(l => l.day === day)
                    const done = dl.filter(l => l.completed).length
                    return (
                      <div
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className="bg-white rounded-xl border border-[var(--border)] p-3 cursor-pointer hover:border-[var(--accent)] transition-colors"
                      >
                        <div className="text-xs font-bold text-[var(--text-muted)] mb-2">{day.slice(0, 3).toUpperCase()}</div>
                        {dl.slice(0, 3).map(l => (
                          <div key={l.id} className={`text-[10px] rounded px-1 py-0.5 mb-1 truncate ${l.completed ? 'bg-green-100 text-green-700' : 'bg-[var(--accent-soft)] text-[var(--accent)]'}`}>
                            {l.subject}
                          </div>
                        ))}
                        {dl.length > 0 && (
                          <div className="text-[10px] text-[var(--text-muted)] mt-1">{done}/{dl.length} done</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
