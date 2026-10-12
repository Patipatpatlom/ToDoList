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
} from 'lucide-react'
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-500" /> High
          </span>
        )
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Medium
          </span>
        )
      case 'LOW':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            Low
          </span>
        )
    }
  }

  const columns: { status: Task['status']; label: string; icon: React.ReactNode; color: string }[] = [
    {
      status: 'TODO',
      label: 'To Do',
      icon: <Circle className="w-4 h-4 text-slate-400" />,
      color: 'border-slate-200 bg-slate-50/50',
    },
    {
      status: 'IN_PROGRESS',
      label: 'In Progress',
      icon: <Clock className="w-4 h-4 text-brand-500" />,
      color: 'border-brand-200 bg-brand-50/20',
    },
    {
      status: 'DONE',
      label: 'Completed',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
      color: 'border-emerald-200 bg-emerald-50/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Task Management Board</h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-800 border border-brand-200">
              <Sparkles className="w-3 h-3" /> Phase 2
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Organize, track, and collaborate on workspace tasks in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="create-task-btn"
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Task
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Tasks</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{tasks.length}</div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-600">In Progress</span>
          <div className="text-2xl font-extrabold text-brand-600 mt-1">
            {tasks.filter((t) => t.status === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Completed</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {tasks.filter((t) => t.status === 'DONE').length}
          </div>
        </div>
        <div className="glass-card rounded-xl p-4 border border-slate-200/70">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">High Priority</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {tasks.filter((t) => t.priority === 'HIGH').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="dashboard-search-input"
            type="text"
            placeholder="Search tasks by title or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-medium text-slate-500">Priority:</span>
          <select
            id="dashboard-priority-filter"
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs font-medium py-1.5 px-2.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.status)
          return (
            <div
              key={col.status}
              className={`rounded-2xl border ${col.color} p-4 flex flex-col min-h-[480px] shadow-sm`}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  {col.icon}
                  <h3 className="text-sm font-bold text-slate-800">{col.label}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 shadow-2xs">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto">
                {colTasks.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-300 rounded-xl">
                    <p className="text-xs text-slate-400">No tasks in this stage</p>
                  </div>
                ) : (
                  colTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {task.description && (
                        <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-slate-600 font-medium">{task.assignee || 'Unassigned'}</span>
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
        title="Create New Task"
        description="Add a new task to your workspace board."
      >
        <form onSubmit={handleCreateTask} className="space-y-4">
          <Input
            id="task-title-input"
            label="Task Title"
            placeholder="e.g. Implement User Authentication"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Description
            </label>
            <textarea
              id="task-description-input"
              rows={3}
              placeholder="Provide background, steps, or acceptance criteria..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 hover:border-slate-400 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
              Priority
            </label>
            <select
              id="task-priority-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button id="submit-new-task-btn" type="submit" variant="primary">
              Create Task
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
