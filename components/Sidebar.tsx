'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const NAV = [
  { href: '/dashboard', icon: '🏡', label: 'Dashboard' },
  { href: '/finance', icon: '💳', label: 'Finance' },
  { href: '/home', icon: '🔧', label: 'Maintenance' },
  { href: '/meals', icon: '🍽️', label: 'Meals' },
  { href: '/bible', icon: '📖', label: 'Bible' },
  { href: '/calendar', icon: '📅', label: 'Calendar' },
  { href: '/homeschool', icon: '✏️', label: 'Homeschool' },
]

export default function Sidebar() {
  const path = usePathname()
  const router = useRouter()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full bg-white border-r border-[var(--border)]">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="text-xl font-bold tracking-tight text-[var(--text)]">
          Oikonom<span className="text-[var(--accent)]">os</span>
        </div>
        <div className="text-[10px] font-semibold tracking-widest text-[var(--text-muted)] mt-0.5">HOUSEHOLD STEWARD</div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = path.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)]'
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[var(--border)]">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-sub)] hover:bg-[var(--surface-alt)] hover:text-[var(--text)] transition-colors"
        >
          <span className="text-base w-5 text-center">↩</span>
          Sign out
        </button>
      </div>
    </aside>
  )
}
