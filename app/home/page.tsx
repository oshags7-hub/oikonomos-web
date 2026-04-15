'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Task = {
  id: string
  title: string
  icon: string
  status: 'upcoming' | 'due' | 'done'
  notes: string
  user_profile: string
}

const STATUS_COLORS = {
  upcoming: 'bg-blue-100 text-blue-800',
  due: 'bg-orange-100 text-orange-800',
  done: 'bg-green-100 text-green-800',
}

const ICONS = ['🔧', '🏠', '🌿', '🚗', '💡', '🪣', '🔑', '🛠️', '🌊', '❄️']

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', icon: '🔧', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadTasks() }, [])

  async function loadTasks() {
    const { data } = await supabase.from('home_tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function addTask() {
    if (!form.title.trim()) return
    setSaving(true)
    const { error } = await supabase.from('home_tasks').insert({
      title: form.title,
      status: 'upcoming',
      user_profile: 'mom',
    })
    if (error) { alert('Save failed: ' + error.message); setSaving(false); return }
    setForm({ title: '', icon: '🔧', notes: '' })
    setShowForm(false)
    setSaving(false)
    loadTasks()
  }

  async function cycleStatus(task: Task) {
    const next = task.status === 'upcoming' ? 'due' : task.status === 'due' ? 'done' : 'upcoming'
    await supabase.from('home_tasks').update({ status: next }).eq('id', task.id)
    loadTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('home_tasks').delete().eq('id', id)
    loadTasks()
  }

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Maintenance</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Track home tasks and repairs</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add Task
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">New Task</h3>
            <div className="space-y-3">
              <input
                placeholder="Task title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <textarea
                placeholder="Notes (optional)"
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] resize-none"
              />
              <div>
                <div className="text-xs font-semibold text-[var(--text-muted)] mb-2">Icon</div>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(icon => (
                    <button
                      key={icon}
                      onClick={() => setForm({ ...form, icon })}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors ${
                        form.icon === icon ? 'bg-[var(--accent-soft)] ring-2 ring-[var(--accent)]' : 'bg-[var(--surface-alt)]'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addTask}
                disabled={saving}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Task'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-[var(--surface-alt)] text-[var(--text-sub)] rounded-xl text-sm font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="space-y-2">
          {tasks.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <div className="text-4xl mb-3">🔧</div>
              <p className="font-medium">No tasks yet</p>
              <p className="text-sm mt-1">Click &quot;Add Task&quot; to track home maintenance</p>
            </div>
          )}
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-4">
              <span className="text-xl">{task.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text)] text-sm truncate">{task.title}</div>
                {task.notes && <div className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{task.notes}</div>}
              </div>
              <button
                onClick={() => cycleStatus(task)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[task.status]}`}
              >
                {task.status}
              </button>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-[var(--text-muted)] hover:text-red-500 text-sm transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
