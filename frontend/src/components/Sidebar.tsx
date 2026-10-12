import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Kanban,
  CheckCircle2,
  Clock,
  Layers,
  Settings,
  FolderKanban,
} from 'lucide-react'
import { cn } from '../utils/cn'

interface NavItem {
  name: string
  to: string
  icon: React.ReactNode
  badge?: string
}

export const Sidebar: React.FC = () => {
  const mainNavItems: NavItem[] = [
    {
      name: 'Task Board',
      to: '/',
      icon: <Kanban className="w-4 h-4" />,
    },
    {
      name: 'All Tasks',
      to: '/?view=all',
      icon: <Layers className="w-4 h-4" />,
      badge: '3',
    },
    {
      name: 'In Progress',
      to: '/?status=IN_PROGRESS',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      name: 'Completed',
      to: '/?status=DONE',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ]

  return (
    <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200/80 bg-white/70 backdrop-blur-md min-h-[calc(100vh-4rem)] p-4">
      <div className="mb-6 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200/70">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">Workspace Alpha</div>
            <div className="text-[11px] text-slate-500">Free Tier · 2 Members</div>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
        Views & Status
      </div>

      <nav className="flex-1 space-y-1">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
              )
            }
          >
            <div className="flex items-center gap-2.5">
              {item.icon}
              <span>{item.name}</span>
            </div>
            {item.badge && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-brand-100 text-brand-700 font-semibold">
                {item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="pt-4 mt-4 border-t border-slate-200 space-y-1">
        <NavLink
          to="/#settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
        >
          <Settings className="w-4 h-4" />
          <span>Project Settings</span>
        </NavLink>
      </div>
    </aside>
  )
}
