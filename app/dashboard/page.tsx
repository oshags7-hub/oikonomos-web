'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Stat = { label: string; value: number | string; icon: string; sub: string; href: string }

export default function DashboardPage() {
  const [stats, setStats] = useState({ bills: 0, tasks: 0, shopping: 0, lessons: 0 })
  const [profile, setProfile] = useState('mom')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const meta = data.session?.user?.user_metadata
      if (meta?.full_name?.toLowerCase().includes('dad')) setProfile('dad')
    })

    async function load() {
      const [billsRes, tasksRes, shoppingRes] = await Promise.all([
        supabase.from('bills').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('home_tasks').select('id', { count: 'exact' }).neq('status', 'done'),
        supabase.from('shopping_items').select('id', { count: 'exact' }).eq('checked', false),
      ])
      setStats({
        bills: billsRes.count ?? 0,
        tasks: tasksRes.count ?? 0,
        shopping: shoppingRes.count ?? 0,
        lessons: 0,
      })
    }
    load()
  }, [])

  const statCards: Stat[] = [
    { label: 'Bills Pending', value: stats.bills, icon: '💳', sub: 'unpaid', href: '/finance' },
    { label: 'Tasks Due', value: stats.tasks, icon: '🔧', sub: 'open tasks', href: '/home' },
    { label: 'Shopping Items', value: stats.shopping, icon: '🛒', sub: 'to buy', href: '/meals' },
    { label: 'Lessons Today', value: stats.lessons, icon: '✏️', sub: 'scheduled', href: '/homeschool' },
  ]

  return (
    <AppShell>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text)]">Good morning</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Here&apos;s what&apos;s happening in your household</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(s => (
            <a
              key={s.label}
              href={s.href}
              className="bg-white rounded-2xl p-5 border border-[var(--border)] hover:border-[var(--accent)] hover:shadow-sm transition-all group"
            >
              <div className="text-2xl mb-3">{s.icon}</div>
              <div className="text-3xl font-bold text-[var(--text)] mb-0.5">{s.value}</div>
              <div className="text-sm font-semibold text-[var(--text-sub)]">{s.label}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{s.sub}</div>
            </a>
          ))}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/meals" className="bg-white rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">🍽️</span>
              <span className="font-semibold text-[var(--text)]">Meal Planner</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Plan meals, manage your shopping list, and generate AI recipes</p>
          </a>
          <a href="/calendar" className="bg-white rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">📅</span>
              <span className="font-semibold text-[var(--text)]">Calendar</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Keep track of family events, appointments, and schedules</p>
          </a>
          <a href="/homeschool" className="bg-white rounded-2xl p-6 border border-[var(--border)] hover:border-[var(--accent)] transition-all">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">✏️</span>
              <span className="font-semibold text-[var(--text)]">Homeschool</span>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Weekly lesson planner for each child with AI assistance</p>
          </a>
        </div>
      </div>
    </AppShell>
  )
}
