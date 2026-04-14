'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from './Sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/auth')
      else setChecked(true)
    })
  }, [])

  if (!checked) return (
    <div className="h-full flex items-center justify-center bg-[var(--bg)]">
      <div className="text-[var(--text-muted)] text-sm">Loading...</div>
    </div>
  )

  return (
    <div className="h-full flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-[var(--bg)]">
        {children}
      </main>
    </div>
  )
}
