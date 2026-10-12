import { create } from 'zustand'
import {
  type Task,
  type CreateTaskDTO,
  DEFAULT_WORKSPACE_ID,
  taskService,
} from '../services/taskService'

interface TaskState {
  tasks: Task[]
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  activeWorkspaceId: string

  // Search & Filter State
  searchQuery: string
  priorityFilter: string

  // Actions
  setSearchQuery: (query: string) => void
  setPriorityFilter: (priority: string) => void
  fetchTasks: (workspaceId?: string) => Promise<void>
  createTask: (data: CreateTaskDTO) => Promise<Task>
  updateTaskStatusOptimistic: (
    taskId: string,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE',
  ) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  setTasks: (tasks: Task[]) => void
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,

  searchQuery: '',
  priorityFilter: 'ALL',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPriorityFilter: (priority: string) => set({ priorityFilter: priority }),

  setTasks: (tasks: Task[]) => set({ tasks }),

  fetchTasks: async (workspaceId = get().activeWorkspaceId) => {
    set({ isLoading: true, error: null })
    try {
      const tasks = await taskService.getTasks(workspaceId)
      set({ tasks, isLoading: false })
    } catch (err: unknown) {
      console.warn('Failed to fetch tasks from backend, using current/fallback state', err)
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch tasks',
        isLoading: false,
      })
    }
  },

  createTask: async (data: CreateTaskDTO) => {
    set({ isSubmitting: true, error: null })
    try {
      const newTask = await taskService.createTask(data, get().activeWorkspaceId)
      set((state) => ({
        tasks: [newTask, ...state.tasks],
        isSubmitting: false,
      }))
      return newTask
    } catch (err: unknown) {
      // In case of network/backend issue, provide optimistic local task so UI continues smoothly
      console.warn('Backend create failed, creating local task as fallback', err)
      const localTask: Task = {
        id: `local-task-${Date.now()}`,
        workspaceId: get().activeWorkspaceId,
        title: data.title,
        description: data.description || '',
        status: 'TODO',
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set((state) => ({
        tasks: [localTask, ...state.tasks],
        isSubmitting: false,
      }))
      return localTask
    }
  },

  updateTaskStatusOptimistic: async (taskId, newStatus) => {
    const previousTasks = get().tasks
    const targetTask = previousTasks.find((t) => t.id === taskId)
    if (!targetTask || targetTask.status === newStatus) return

    // 1. Optimistic UI update: update local state immediately
    const updatedTasks = previousTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    )
    set({ tasks: updatedTasks })

    // 2. Persist to Backend API
    try {
      await taskService.updateTaskStatus(taskId, newStatus, get().activeWorkspaceId)
    } catch (err) {
      console.error('Failed to update task status on backend, rolling back state', err)
      // Rollback to previous state if API call failed
      set({ tasks: previousTasks, error: 'Failed to update task status on server' })
      throw err
    }
  },

  deleteTask: async (taskId) => {
    const previousTasks = get().tasks
    // Optimistic UI update: remove task immediately
    set({ tasks: previousTasks.filter((t) => t.id !== taskId) })

    try {
      await taskService.deleteTask(taskId, get().activeWorkspaceId)
    } catch (err) {
      console.error('Failed to delete task from backend, rolling back state', err)
      // Rollback if deletion failed
      set({ tasks: previousTasks, error: 'Failed to delete task on server' })
      throw err
    }
  },
}))
