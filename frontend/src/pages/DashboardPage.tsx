import React, { useState, useEffect, useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
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
  Layers,
  Loader2,
  FolderKanban,
  GripVertical,
  Trash2,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '../components/Button'
import { TaskModal, type TaskFormValues } from '../components/TaskModal'
import { ConfirmModal } from '../components/ConfirmModal'
import { useTaskStore } from '../store/taskStore'
import { type Task } from '../services/taskService'
import { cn } from '../utils/cn'

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const statusFilterParam = searchParams.get('status') as
    | 'TODO'
    | 'IN_PROGRESS'
    | 'DONE'
    | null
  const {
    tasks,
    activeWorkspace,
    isLoading,
    isSubmitting,
    searchQuery,
    priorityFilter,
    setSearchQuery,
    setPriorityFilter,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskStatusOptimistic,
    deleteTask,
  } = useTaskStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Fetch live tasks on mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Dynamic Reactive Summary Statistics
  const stats = useMemo(() => {
    const total = tasks.length
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length
    const completed = tasks.filter((t) => t.status === 'DONE').length
    const highPriority = tasks.filter((t) => t.priority === 'HIGH').length

    return { total, inProgress, completed, highPriority }
  }, [tasks])

  // Drag & Drop Handler with Optimistic UI Update and Toast Notification
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return

    // If dropped in same column and position, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return
    }

    const newStatus = destination.droppableId as 'TODO' | 'IN_PROGRESS' | 'DONE'
    try {
      await updateTaskStatusOptimistic(draggableId, newStatus)
      toast.success(t('dashboard.toast.updateStatusSuccess'))
    } catch {
      toast.error(t('dashboard.toast.error'))
    }
  }

  // Handle Create or Edit task submit with custom assignee name
  const handleFormSubmit = async (values: TaskFormValues) => {
    try {
      const trimmedName = values.assigneeName?.trim() || null

      if (editingTask) {
        await updateTask(editingTask.id, {
          title: values.title,
          description: values.description || null,
          priority: values.priority,
          assigneeName: trimmedName,
        })
        toast.success(t('common.save'))
        setEditingTask(null)
      } else {
        await createTask({
          title: values.title,
          description: values.description,
          priority: values.priority,
          assigneeName: trimmedName || undefined,
        })
        toast.success(t('dashboard.toast.createSuccess'))
      }
    } catch {
      toast.error(t('dashboard.toast.error'))
    }
  }

  // Trigger Delete Confirmation
  const handleDeleteTask = (task: Task, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setTaskToDelete(task)
  }

  // Confirm and execute task deletion
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return
    setIsDeleting(true)
    try {
      await deleteTask(taskToDelete.id)
      toast.success(t('dashboard.toast.deleteSuccess'))
      setTaskToDelete(null)
      setIsModalOpen(false)
      setEditingTask(null)
    } catch {
      toast.error(t('dashboard.toast.error'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenCreateModal = () => {
    setEditingTask(null)
    setIsModalOpen(true)
  }

  const handleCardClick = (task: Task) => {
    setEditingTask(task)
    setIsModalOpen(true)
  }

  // Search & Filter computation (Derived State)
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const titleMatch = task.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const descMatch =
        task.description &&
        task.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSearch = titleMatch || Boolean(descMatch)
      const matchesPriority =
        priorityFilter === 'ALL' || task.priority === priorityFilter
      return matchesSearch && matchesPriority
    })
  }, [tasks, searchQuery, priorityFilter])

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Today'
    try {
      const date = new Date(dateString)
      return isNaN(date.getTime())
        ? dateString
        : date.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
          })
    } catch {
      return dateString
    }
  }

  const columns = useMemo<
    {
      status: 'TODO' | 'IN_PROGRESS' | 'DONE'
      label: string
      icon: React.ReactNode
      dotColor: string
    }[]
  >(
    () => [
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
    ],
    [t],
  )

  // Filter columns dynamically if a specific status is selected in the Sidebar
  const activeColumns = useMemo(() => {
    if (!statusFilterParam) return columns
    return columns.filter((col) => col.status === statusFilterParam)
  }, [columns, statusFilterParam])

  return (
    <div className="space-y-7 pb-8 select-none">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {t('dashboard.title')}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-2xs transition-all',
                activeWorkspace.bgColor,
                activeWorkspace.textColor,
              )}
            >
              <FolderKanban className="w-3.5 h-3.5" />
              {activeWorkspace.name}
            </span>
            {isLoading && (
              <Loader2 className="w-4 h-4 text-brand-500 animate-spin ml-1" />
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            id="create-task-btn"
            variant="primary"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="rounded-lg shadow-xs hover:shadow-md transition-all duration-200"
          >
            {t('dashboard.createTask')}
          </Button>
        </div>
      </div>

      {/* Dynamic Reactive Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-slate-400">
            {t('dashboard.kpi.totalTasks')}
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {stats.total}
          </div>
          <Layers className="w-10 h-10 absolute -right-1 -bottom-1 text-slate-100 pointer-events-none" />
        </div>

        {/* In Progress */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-brand-600">
            {t('dashboard.kpi.inProgress')}
          </span>
          <div className="text-2xl font-bold text-brand-600 mt-1">
            {stats.inProgress}
          </div>
          <Clock className="w-10 h-10 absolute -right-1 -bottom-1 text-brand-100/70 pointer-events-none" />
        </div>

        {/* Completed */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-emerald-600">
            {t('dashboard.kpi.completed')}
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            {stats.completed}
          </div>
          <CheckCircle2 className="w-10 h-10 absolute -right-1 -bottom-1 text-emerald-100/70 pointer-events-none" />
        </div>

        {/* High Priority */}
        <div className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-shadow relative overflow-hidden">
          <span className="text-xs font-medium text-red-600">
            {t('dashboard.kpi.highPriority')}
          </span>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {stats.highPriority}
          </div>
          <AlertTriangle className="w-10 h-10 absolute -right-1 -bottom-1 text-red-100/70 pointer-events-none" />
        </div>
      </div>

      {/* Filter and Search Bar (Bound to State) */}
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
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-medium py-1.5 px-3 rounded-lg bg-slate-50 text-slate-700 border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer"
          >
            <option value="ALL">{t('dashboard.priorities.all')}</option>
            <option value="HIGH">{t('dashboard.priorities.high')}</option>
            <option value="MEDIUM">{t('dashboard.priorities.medium')}</option>
            <option value="LOW">{t('dashboard.priorities.low')}</option>
          </select>
        </div>
      </div>

      {/* Filter indicator banner when viewing single status from sidebar */}
      {statusFilterParam && (
        <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-brand-50/80 border border-brand-100 text-xs shadow-2xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="font-medium text-slate-500">
              {t('dashboard.filteringStatus')}
            </span>
            <span className="font-bold text-brand-700 bg-white px-2.5 py-1 rounded-md border border-brand-200 shadow-xs">
              {columns.find((c) => c.status === statusFilterParam)?.label || statusFilterParam}
            </span>
          </div>
          <Link
            to="/"
            className="text-brand-600 hover:text-brand-800 font-semibold hover:underline flex items-center gap-1.5 transition-colors"
          >
            <span>{t('dashboard.showAllColumns')}</span>
            <span>&rarr;</span>
          </Link>
        </div>
      )}

      {/* Drag & Drop Kanban Columns */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div
          className={cn(
            'grid gap-6 items-start',
            activeColumns.length === 1
              ? 'grid-cols-1 max-w-2xl mx-auto w-full'
              : 'grid-cols-1 md:grid-cols-3',
          )}
        >
          {activeColumns.map((col) => {
            const colTasks = filteredTasks.filter((t) => t.status === col.status)
            return (
              <div
                key={col.status}
                className="rounded-2xl bg-slate-100/70 p-4 flex flex-col min-h-[520px]"
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

                {/* Droppable Area */}
                <Droppable droppableId={col.status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        'space-y-3 flex-1 overflow-y-auto transition-colors rounded-xl min-h-[420px] p-1',
                        snapshot.isDraggingOver && 'bg-slate-200/50',
                      )}
                    >
                      {colTasks.length === 0 && !snapshot.isDraggingOver ? (
                        <div className="h-28 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-white/40">
                          <p className="text-xs text-slate-400">
                            {t('dashboard.columns.empty')}
                          </p>
                        </div>
                      ) : (
                        colTasks.map((task, index) => (
                          <Draggable
                            key={task.id}
                            draggableId={task.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={cn(
                                  'bg-white rounded-xl p-4 shadow-xs transition-all cursor-pointer group relative',
                                  snapshot.isDragging
                                    ? 'shadow-xl ring-2 ring-brand-500 rotate-1 scale-[1.02] z-50'
                                    : 'hover:shadow-md hover:-translate-y-0.5',
                                )}
                                onClick={() => handleCardClick(task)}
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing p-0.5 -ml-1 rounded transition"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Drag task"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-900 group-hover:text-brand-600 transition-colors truncate">
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {getPriorityBadge(task.priority)}
                                    {/* Quick Delete Trash Button */}
                                    <button
                                      id={`delete-task-btn-${task.id}`}
                                      type="button"
                                      onClick={(e) => handleDeleteTask(task, e)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all"
                                      title="Delete task"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
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
                                      {task.assignee?.name ||
                                        t('dashboard.unassigned')}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{formatDate(task.createdAt)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTask(null)
        }}
        onSubmit={handleFormSubmit}
        initialTask={editingTask}
        isLoading={isSubmitting}
        onDelete={(task) => handleDeleteTask(task)}
      />

      {/* Confirmation Dialog for Deletion */}
      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={t('dashboard.deleteModal.title')}
        message={t('dashboard.deleteModal.message')}
        itemName={taskToDelete?.title}
        confirmText={t('dashboard.deleteModal.confirm')}
        cancelText={t('dashboard.deleteModal.cancel')}
        isLoading={isDeleting}
      />
    </div>
  )
}
