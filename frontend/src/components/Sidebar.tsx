import React from 'react'
import { NavLink } from 'react-router-dom'
import { Kanban, CheckCircle2, Clock, FolderKanban } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../utils/cn'

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()

  const navItems = [
    {
      name: t('sidebar.taskBoard'),
      to: '/',
      icon: <Kanban className="w-4 h-4" />,
    },
    {
      name: t('sidebar.inProgress'),
      to: '/?status=IN_PROGRESS',
      icon: <Clock className="w-4 h-4" />,
    },
    {
      name: t('sidebar.completed'),
      to: '/?status=DONE',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ]

  return (
    <aside className="hidden lg:flex w-60 flex-col bg-transparent min-h-[calc(100vh-4rem)] p-4 pr-6 select-none">
      {/* Workspace pill - light & friendly */}
      <div className="mb-6 p-3 rounded-2xl bg-white shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
            <FolderKanban className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800">
              {t('sidebar.workspaceTitle')}
            </div>
            <div className="text-[11px] text-slate-400">
              {t('sidebar.workspaceSubtitle')}
            </div>
          </div>
        </div>
      </div>

      <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2">
        {t('sidebar.views')}
      </div>

      {/* Simplified nav list */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white',
              )
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
