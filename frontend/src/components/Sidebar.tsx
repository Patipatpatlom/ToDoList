import React, { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Kanban,
  CheckCircle2,
  Clock,
  Circle,
  FolderKanban,
  ChevronsUpDown,
  Check,
  Plus,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '../utils/cn'
import { useTaskStore } from '../store/taskStore'

interface WorkspaceItem {
  id: string
  name: string
  subtitle: string
  bgColor: string
  textColor: string
}

export const Sidebar: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const { tasks } = useTaskStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Workspaces list
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([
    {
      id: 'f52aa0b7-dcf1-4135-bc24-3c339e7044d0',
      name: 'Product Engineering',
      subtitle: 'Pro · 2 Members',
      bgColor: 'bg-brand-50',
      textColor: 'text-brand-600',
    },
    {
      id: 'ws-marketing',
      name: 'Marketing & Brand',
      subtitle: 'Free · 3 Members',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      id: 'ws-personal',
      name: 'Personal Space',
      subtitle: 'Personal · 1 Member',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
  ])

  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceItem>(workspaces[0])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  // Close dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
        setIsCreating(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        setIsCreating(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isDropdownOpen])

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

  const handleSelectWorkspace = (ws: WorkspaceItem) => {
    setActiveWorkspace(ws)
    setIsDropdownOpen(false)
    setIsCreating(false)
    toast.success(`${t('sidebar.workspaceSwitched')} ${ws.name}`)
  }

  const handleCreateWorkspaceSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    const newWs: WorkspaceItem = {
      id: `ws-${Date.now()}`,
      name: newWorkspaceName.trim(),
      subtitle: 'Free · 1 Member',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    }

    setWorkspaces((prev) => [...prev, newWs])
    setActiveWorkspace(newWs)
    setNewWorkspaceName('')
    setIsCreating(false)
    setIsDropdownOpen(false)
    toast.success(`${t('sidebar.workspaceCreated')}: ${newWs.name}`)
  }

  return (
    <aside className="hidden lg:flex w-64 flex-col bg-transparent min-h-[calc(100vh-4rem)] p-4 pr-6 select-none relative">
      {/* Workspace Selector Dropdown Container */}
      <div className="relative mb-6" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((prev) => !prev)}
          className={cn(
            'w-full p-3 rounded-2xl bg-white shadow-xs border transition-all text-left cursor-pointer group',
            isDropdownOpen
              ? 'border-brand-500 ring-2 ring-brand-100 shadow-md'
              : 'border-transparent hover:shadow-md hover:border-slate-200',
          )}
          title="Click to switch or create workspace"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  'p-2 rounded-xl group-hover:scale-105 transition-transform shrink-0',
                  activeWorkspace.bgColor,
                  activeWorkspace.textColor,
                )}
              >
                <FolderKanban className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate group-hover:text-brand-600 transition-colors">
                  {activeWorkspace.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  {activeWorkspace.subtitle}
                </div>
              </div>
            </div>
            <ChevronsUpDown
              className={cn(
                'w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-all shrink-0',
                isDropdownOpen && 'rotate-180 text-brand-600',
              )}
            />
          </div>
        </button>

        {/* Popover Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              {t('sidebar.switchWorkspace')}
            </div>

            {/* List of available workspaces */}
            <div className="space-y-1 max-h-56 overflow-y-auto py-1">
              {workspaces.map((ws) => {
                const isSelected = ws.id === activeWorkspace.id
                return (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSelectWorkspace(ws)}
                    className={cn(
                      'w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors cursor-pointer group',
                      isSelected
                        ? 'bg-brand-50/80 text-brand-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700',
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'p-1.5 rounded-lg shrink-0',
                          ws.bgColor,
                          ws.textColor,
                        )}
                      >
                        <FolderKanban className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{ws.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ws.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-brand-600 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="h-px bg-slate-100 my-1.5" />

            {/* Create New Workspace Form / Action */}
            {isCreating ? (
              <form
                onSubmit={handleCreateWorkspaceSubmit}
                className="p-1 space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder={t('sidebar.newWorkspacePlaceholder')}
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newWorkspaceName.trim()}
                  className="w-full py-1.5 px-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {t('sidebar.createWorkspace')}
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-brand-700 hover:bg-brand-50/70 transition-colors cursor-pointer"
              >
                <div className="p-1 rounded-md bg-slate-100 group-hover:bg-brand-100 text-slate-500">
                  <Plus className="w-3.5 h-3.5" />
                </div>
                <span>{t('sidebar.createWorkspace')}</span>
              </button>
            )}
          </div>
        )}
      </div>

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
