import React, { useState } from 'react'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Circle,
  AlertTriangle,
  Calendar,
  User,
  Sparkles,
  Layers,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'

interface Task {
  id: string
  title: string
  description?: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assignee?: string
  createdAt: string
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Setup Database Migration & Seed script',
    description: 'Ensure PostgreSQL 16 schema with Prisma is up to date and seeded with initial demo data.',
    status: 'DONE',
    priority: 'HIGH',
    assignee: 'John Doe',
    createdAt: 'Today, 10:30 AM',
  },
  {
    id: 'task-2',
    title: 'Develop Task RESTful API & Transactions',
    description: 'Implement Layered Architecture with Controller, Service, and Repository layers.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: 'Jane Smith',
    createdAt: 'Today, 01:15 PM',
  },
  {
    id: 'task-3',
    title: 'Setup Vitest Automated Testing Suite',
    description: 'Verify Unit and Integration tests with Supertest and high branch test coverage.',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: 'John Doe',
    createdAt: 'Yesterday',
  },
]

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL')
  const [isModalOpen, setIsModalOpen] = useState(false)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTitle,
      description: newDescription,
      status: 'TODO',
      priority: newPriority,
      assignee: 'Current User',
      createdAt: 'Just now',
    }

    setTasks([newTask, ...tasks])
    setNewTitle('')
    setNewDescription('')
    setNewPriority('MEDIUM')
    setIsModalOpen(false)
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesPriority = selectedPriority === 'ALL' || task.priority === selectedPriority
    return matchesSearch && matchesPriority
  })

  const getPriorityBadge = (priority: Task['priority']) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-red-50 text-red-600">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            {t('dashboard.priorities.high')}
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-600">
            {t('dashboard.priorities.medium')}
          </span>
        )
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
            {t('dashboard.priorities.low')}
          </span>
        )
    }
  }

  const columns: { status: Task['status']; label: string; icon: React.ReactNode; dotColor: string }[] = [
    {
      status: 'TODO',
      label: t('dashboard.columns.todo'),
      icon: <Circle className="w-3.5 h-3.5 text-slate-400" />,
      dotColor: 'bg-slate-400',
    },
    {
      status: 'IN_PROGRESS',
      label: t('dashboard.columns.inProgress'),
      icon: <Clock className="w-3.5 h-3.5 text-brand-500" />,
      dotColor: 'bg-brand-500',
    },
    {
      status: 'DONE',
      label: t('dashboard.columns.done'),
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />,
      dotColor: 'bg-emerald-500',
    },
  ]

  return (
    <div className="space-y-7 pb-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('dashboard.title')}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-600">
              <Sparkles className="w-3 h-3" /> {t('dashboard.phaseBadge')}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="create-task-btn"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-lg shadow-xs hover:shadow-md transition-all duration-200"
          >
            {t('dashboard.createTask')}
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards - Compact with Faded Icons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-slate-400">
            {t('dashboard.kpi.totalTasks')}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{tasks.length}</div>
          <Layers className="w-10 h-10 absolute -right-1 -bottom-1 text-slate-100 pointer-events-none" />
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-brand-600">
            {t('dashboard.kpi.inProgress')}
          </span>
          <div className="text-2xl font-bold text-brand-600 mt-1">
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
          <Clock className="w-10 h-10 absolute -right-1 -bottom-1 text-brand-100/70 pointer-events-none" />
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-emerald-600">
            {t('dashboard.kpi.completed')}
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {tasks.filter((t) => t.status === 'DONE').length}
          </div>
          <CheckCircle2 className="w-10 h-10 absolute -right-1 -bottom-1 text-emerald-100/70 pointer-events-none" />
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-red-600">
            {t('dashboard.kpi.highPriority')}
          </span>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {tasks.filter((t) => t.priority === 'HIGH').length}
          </div>
          <AlertTriangle className="w-10 h-10 absolute -right-1 -bottom-1 text-red-100/70 pointer-events-none" />
        </div>
      </div>

      {/* Filter and Search Bar - Clean & Soft */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-2.5 rounded-xl shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="dashboard-search-input"
            type="text"
            placeholder={t('dashboard.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm rounded-lg bg-slate-50 focus:bg-white border-0 focus:ring-2 focus:ring-brand-500 placeholder:text-slate-400 transition"
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">
            {t('dashboard.priorityFilterLabel')}
          </span>
          <select
            id="dashboard-priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 rounded-lg bg-slate-50 text-slate-700 border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">{t('dashboard.priorities.all')}</option>
            <option value="HIGH">{t('dashboard.priorities.high')}</option>
            <option value="MEDIUM">{t('dashboard.priorities.medium')}</option>
            <option value="LOW">{t('dashboard.priorities.low')}</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns - Soft Background, No Hard Borders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status)
          return (
            <div
              key={col.status}
              className="rounded-2xl bg-slate-100/70 p-4 flex flex-col min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    {col.label}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 shadow-xs">
                  {colTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-28 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white/40">
                    <p className="text-xs text-slate-400">
                      {t('dashboard.columns.empty')}
                    </p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl p-4 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-50 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600 font-medium">
                            {task.assignee || t('dashboard.unassigned')}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{task.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Modal */}
      <Modal
        id="create-task-modal"
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t('dashboard.modal.title')}
        description={t('dashboard.modal.description')}
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            id="task-title-input"
            label={t('dashboard.modal.taskTitle')}
            placeholder={t('dashboard.modal.taskTitlePlaceholder')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {t('dashboard.modal.descriptionLabel')}
            </label>
            <textarea
              id="task-description-input"
              rows={3}
              placeholder={t('dashboard.modal.descriptionPlaceholder')}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-300 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              {t('dashboard.modal.priorityLabel')}
            </label>
            <select
              id="task-priority-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="LOW">{t('dashboard.priorities.low')}</option>
              <option value="MEDIUM">{t('dashboard.priorities.medium')}</option>
              <option value="HIGH">{t('dashboard.priorities.high')}</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              {t('dashboard.modal.cancelButton')}
            </Button>
            <Button id="submit-new-task-btn" type="submit" variant="primary">
              {t('dashboard.modal.submitButton')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
