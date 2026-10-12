import React from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Kanban, CheckCircle2, Clock, Circle, FolderKanban, ChevronsUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '../utils/cn'
import { useTaskStore } from '../store/taskStore'

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { tasks } = useTaskStore()

  const currentStatus = searchParams.get('status')

  // Calculate live task counts for badges
  const totalCount = tasks.length
  const todoCount = tasks.filter((t) => t.status === 'TODO').length
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length
  const doneCount = tasks.filter((t) => t.status === 'DONE').length

  const navItems = [
    {
      name: t('sidebar.taskBoard'),
      to: '/',
      status: null,
      icon: <Kanban className="w-4 h-4" />,
      count: totalCount,
    },
    {
      name: t('sidebar.todo'),
      to: '/?status=TODO',
      status: 'TODO',
      icon: <Circle className="w-4 h-4 text-slate-400" />,
      count: todoCount,
    },
    {
      name: t('sidebar.inProgress'),
      to: '/?status=IN_PROGRESS',
      status: 'IN_PROGRESS',
      icon: <Clock className="w-4 h-4 text-brand-500" />,
      count: inProgressCount,
    },
    {
      name: t('sidebar.completed'),
      to: '/?status=DONE',
      status: 'DONE',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      count: doneCount,
    },
  ]

  const handleWorkspaceClick = () => {
    toast.info('Workspace: Product Engineering (2 Active Members: Alice, Bob)', {
      description: 'Role: Admin • Plan: Free Tier',
    })
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-transparent min-h-[calc(100vh-4rem)] p-4 pr-6 select-none">
      {/* Interactive Workspace pill */}
      <button
        type="button"
        onClick={handleWorkspaceClick}
        className="mb-6 p-3 rounded-2xl bg-white shadow-xs hover:shadow-md hover:border-brand-200 border border-transparent transition-all text-left group cursor-pointer"
        title="Click to view workspace details"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-brand-600 transition-colors">
                {t('sidebar.workspaceTitle')}
              </div>
              <div className="text-[11px] text-slate-400">
                {t('sidebar.workspaceSubtitle')}
              </div>
            </div>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </div>
      </button>

      <div className="text-[11px] font-semibold text-slate-400 px-3 mb-2 uppercase tracking-wider">
        {t('sidebar.views')}
      </div>

      {/* Nav list with active indicator & live badges */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.status === null
              ? currentStatus === null
              : currentStatus === item.status

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-brand-50 text-brand-700 font-semibold shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white',
              )}
            >
              {item.icon}
              <span className="flex-1 truncate">{item.name}</span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors',
                  isActive
                    ? 'bg-brand-200/60 text-brand-800'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200',
                )}
              >
                {item.count}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
