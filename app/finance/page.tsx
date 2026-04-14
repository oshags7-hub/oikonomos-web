'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { supabase } from '@/lib/supabase'

type Bill = {
  id: string
  name: string
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  category: string
  user_profile: string
}

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
}

const CATEGORIES = ['Housing', 'Utilities', 'Insurance', 'Subscriptions', 'Food', 'Transport', 'Other']

export default function FinancePage() {
  const [bills, setBills] = useState<Bill[]>([])
  const [profile, setProfile] = useState('mom')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', due_date: '', category: 'Housing' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadBills() }, [])

  async function loadBills() {
    const { data } = await supabase.from('bills').select('*').order('due_date')
    if (data) setBills(data)
  }

  async function addBill() {
    if (!form.name || !form.amount) return
    setSaving(true)
    await supabase.from('bills').insert({
      name: form.name,
      amount: parseFloat(form.amount),
      due_date: form.due_date || null,
      category: form.category,
      status: 'pending',
      user_profile: profile,
    })
    setForm({ name: '', amount: '', due_date: '', category: 'Housing' })
    setShowForm(false)
    setSaving(false)
    loadBills()
  }

  async function cycleStatus(bill: Bill) {
    const next = bill.status === 'pending' ? 'paid' : bill.status === 'paid' ? 'overdue' : 'pending'
    await supabase.from('bills').update({ status: next }).eq('id', bill.id)
    loadBills()
  }

  async function deleteBill(id: string) {
    if (!confirm('Delete this bill?')) return
    await supabase.from('bills').delete().eq('id', id)
    loadBills()
  }

  const total = bills.reduce((s, b) => s + b.amount, 0)
  const pending = bills.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0)

  return (
    <AppShell>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Finance</h1>
            <p className="text-[var(--text-muted)] text-sm mt-0.5">Manage bills and track spending</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            + Add Bill
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 border border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">TOTAL BILLS</div>
            <div className="text-2xl font-bold text-[var(--text)]">${total.toFixed(2)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{bills.length} bills tracked</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-[var(--border)]">
            <div className="text-xs font-semibold text-[var(--text-muted)] mb-1">PENDING</div>
            <div className="text-2xl font-bold text-[var(--accent)]">${pending.toFixed(2)}</div>
            <div className="text-xs text-[var(--text-muted)] mt-0.5">{bills.filter(b => b.status === 'pending').length} unpaid</div>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 mb-5">
            <h3 className="font-semibold text-[var(--text)] mb-4">New Bill</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Bill name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                type="number"
                placeholder="Amount"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                type="date"
                value={form.due_date}
                onChange={e => setForm({ ...form, due_date: e.target.value })}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-xl border border-[var(--border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={addBill}
                disabled={saving}
                className="px-4 py-2 bg-[var(--accent)] text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Bill'}
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

        {/* Bills list */}
        <div className="space-y-2">
          {bills.length === 0 && (
            <div className="text-center py-16 text-[var(--text-muted)]">
              <div className="text-4xl mb-3">💳</div>
              <p className="font-medium">No bills yet</p>
              <p className="text-sm mt-1">Click &quot;Add Bill&quot; to get started</p>
            </div>
          )}
          {bills.map(bill => (
            <div key={bill.id} className="bg-white rounded-xl border border-[var(--border)] px-4 py-3 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[var(--text)] text-sm truncate">{bill.name}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {bill.category}
                  {bill.due_date && ` · Due ${new Date(bill.due_date).toLocaleDateString()}`}
                </div>
              </div>
              <div className="text-sm font-bold text-[var(--text)]">${bill.amount.toFixed(2)}</div>
              <button
                onClick={() => cycleStatus(bill)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${STATUS_COLORS[bill.status]}`}
              >
                {bill.status}
              </button>
              <button
                onClick={() => deleteBill(bill.id)}
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
