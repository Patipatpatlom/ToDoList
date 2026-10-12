import { create } from 'zustand'
import {
  type Task,
  type CreateTaskDTO,
  DEFAULT_WORKSPACE_ID,
  taskService,
} from '../services/taskService'

export interface WorkspaceItem {
  id: string
  name: string
  subtitle: string
  bgColor: string
  textColor: string
}

export const DEFAULT_WORKSPACES: WorkspaceItem[] = [
  {
    id: DEFAULT_WORKSPACE_ID,
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
]

const INITIAL_MARKETING_TASKS: Task[] = [
  {
    id: 'mkt-1',
    workspaceId: 'ws-marketing',
    title: 'Launch Product Campaign Q4',
    description: 'Coordinate multi-channel marketing campaigns across social media and newsletter.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: { id: 'usr-sarah', name: 'Sarah Connor', email: 'sarah@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mkt-2',
    workspaceId: 'ws-marketing',
    title: 'Design Brand Assets & Social Banners',
    description: 'Create high-resolution banners and illustrations for release announcement.',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: { id: 'usr-alex', name: 'Alex Designer', email: 'alex@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'mkt-3',
    workspaceId: 'ws-marketing',
    title: 'Publish TaskFlow 2.0 Press Release',
    description: 'Distribute technical press release to developer media outlets.',
    status: 'DONE',
    priority: 'LOW',
    assignee: { id: 'usr-mark', name: 'Mark Content', email: 'mark@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

const INITIAL_PERSONAL_TASKS: Task[] = [
  {
    id: 'per-1',
    workspaceId: 'ws-personal',
    title: 'Plan Weekly Sprint Goals',
    description: 'Review prioritized backlog and plan milestones for this week.',
    status: 'TODO',
    priority: 'MEDIUM',
    assignee: { id: 'usr-me', name: 'Me', email: 'me@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'per-2',
    workspaceId: 'ws-personal',
    title: 'Prepare presentation for team sync',
    description: 'Summarize key deliverables achieved in Phase 2.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    assignee: { id: 'usr-me', name: 'Me', email: 'me@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface TaskState {
  tasks: Task[]
  workspaceTasksMap: Record<string, Task[]>
  workspaces: WorkspaceItem[]
  activeWorkspace: WorkspaceItem
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
  switchWorkspace: (workspace: WorkspaceItem) => Promise<void>
  addWorkspace: (workspace: WorkspaceItem) => void
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
  workspaceTasksMap: {
    [DEFAULT_WORKSPACE_ID]: [],
    'ws-marketing': INITIAL_MARKETING_TASKS,
    'ws-personal': INITIAL_PERSONAL_TASKS,
  },
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspace: DEFAULT_WORKSPACES[0],
  isLoading: false,
  isSubmitting: false,
  error: null,
  activeWorkspaceId: DEFAULT_WORKSPACE_ID,

  searchQuery: '',
  priorityFilter: 'ALL',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPriorityFilter: (priority: string) => set({ priorityFilter: priority }),

  setTasks: (tasks: Task[]) => {
    const wsId = get().activeWorkspaceId
    set((state) => ({
      tasks,
      workspaceTasksMap: {
        ...state.workspaceTasksMap,
        [wsId]: tasks,
      },
    }))
  },

  switchWorkspace: async (workspace: WorkspaceItem) => {
    const currentMap = get().workspaceTasksMap
    set({
      activeWorkspace: workspace,
      activeWorkspaceId: workspace.id,
      error: null,
    })

    if (workspace.id === DEFAULT_WORKSPACE_ID) {
      await get().fetchTasks(DEFAULT_WORKSPACE_ID)
    } else {
      const existingTasks = currentMap[workspace.id] || []
      set({
        tasks: existingTasks,
        isLoading: false,
      })
    }
  },

  addWorkspace: (newWs: WorkspaceItem) => {
    set((state) => ({
      workspaces: [...state.workspaces, newWs],
      workspaceTasksMap: {
        ...state.workspaceTasksMap,
        [newWs.id]: [],
      },
      activeWorkspace: newWs,
      activeWorkspaceId: newWs.id,
      tasks: [],
    }))
  },

  fetchTasks: async (workspaceId = get().activeWorkspaceId) => {
    set({ isLoading: true, error: null })
    try {
      if (workspaceId === DEFAULT_WORKSPACE_ID) {
        const tasks = await taskService.getTasks(workspaceId)
        set((state) => ({
          tasks,
          isLoading: false,
          workspaceTasksMap: {
            ...state.workspaceTasksMap,
            [DEFAULT_WORKSPACE_ID]: tasks,
          },
        }))
      } else {
        const cached = get().workspaceTasksMap[workspaceId] || []
        set({ tasks: cached, isLoading: false })
      }
    } catch (err: unknown) {
      // In case of error, retrieve cached tasks if available
      const fallbackTasks = get().workspaceTasksMap[workspaceId] || get().tasks
      set({
        tasks: fallbackTasks,
        error: err instanceof Error ? err.message : 'Failed to fetch tasks',
        isLoading: false,
      })
    }
  },

  createTask: async (data: CreateTaskDTO) => {
    set({ isSubmitting: true, error: null })
    const activeWsId = get().activeWorkspaceId

    try {
      if (activeWsId === DEFAULT_WORKSPACE_ID) {
        const newTask = await taskService.createTask(data, activeWsId)
        set((state) => {
          const updated = [newTask, ...state.tasks]
          return {
            tasks: updated,
            workspaceTasksMap: {
              ...state.workspaceTasksMap,
              [activeWsId]: updated,
            },
            isSubmitting: false,
          }
        })
        return newTask
      } else {
        // Local workspace creation
        const localTask: Task = {
          id: `local-task-${Date.now()}`,
          workspaceId: activeWsId,
          title: data.title,
          description: data.description || '',
          status: 'TODO',
          priority: data.priority || 'MEDIUM',
          assigneeId: data.assigneeId || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => {
          const updated = [localTask, ...state.tasks]
          return {
            tasks: updated,
            workspaceTasksMap: {
              ...state.workspaceTasksMap,
              [activeWsId]: updated,
            },
            isSubmitting: false,
          }
        })
        return localTask
      }
    } catch {
      const localTask: Task = {
        id: `local-task-${Date.now()}`,
        workspaceId: activeWsId,
        title: data.title,
        description: data.description || '',
        status: 'TODO',
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      set((state) => {
        const updated = [localTask, ...state.tasks]
        return {
          tasks: updated,
          workspaceTasksMap: {
            ...state.workspaceTasksMap,
            [activeWsId]: updated,
          },
          isSubmitting: false,
        }
      })
      return localTask
    }
  },

  updateTaskStatusOptimistic: async (taskId, newStatus) => {
    const previousTasks = get().tasks
    const activeWsId = get().activeWorkspaceId
    const targetTask = previousTasks.find((t) => t.id === taskId)
    if (!targetTask || targetTask.status === newStatus) return

    // 1. Optimistic UI update: update local state immediately
    const updatedTasks = previousTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    )
    set((state) => ({
      tasks: updatedTasks,
      workspaceTasksMap: {
        ...state.workspaceTasksMap,
        [activeWsId]: updatedTasks,
      },
    }))

    // 2. Persist to Backend API if default workspace
    if (activeWsId === DEFAULT_WORKSPACE_ID) {
      try {
        await taskService.updateTaskStatus(taskId, newStatus, activeWsId)
      } catch (err) {
        set((state) => ({
          tasks: previousTasks,
          workspaceTasksMap: {
            ...state.workspaceTasksMap,
            [activeWsId]: previousTasks,
          },
          error: 'Failed to update task status on server',
        }))
        throw err
      }
    }
  },

  deleteTask: async (taskId) => {
    const previousTasks = get().tasks
    const activeWsId = get().activeWorkspaceId
    const updatedTasks = previousTasks.filter((t) => t.id !== taskId)

    set((state) => ({
      tasks: updatedTasks,
      workspaceTasksMap: {
        ...state.workspaceTasksMap,
        [activeWsId]: updatedTasks,
      },
    }))

    if (activeWsId === DEFAULT_WORKSPACE_ID) {
      try {
        await taskService.deleteTask(taskId, activeWsId)
      } catch (err) {
        set((state) => ({
          tasks: previousTasks,
          workspaceTasksMap: {
            ...state.workspaceTasksMap,
            [activeWsId]: previousTasks,
          },
          error: 'Failed to delete task on server',
        }))
        throw err
      }
    }
  },
}))
