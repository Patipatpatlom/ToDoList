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

export const DEFAULT_WORKSPACES: WorkspaceItem[] = []

const TASKS_STORAGE_KEY = 'taskflow_workspace_tasks'
const WORKSPACES_STORAGE_KEY = 'taskflow_workspaces'
const ACTIVE_WORKSPACE_KEY = 'taskflow_active_workspace_id'
const WORKSPACE_RESET_FLAG_KEY = 'taskflow_workspaces_reset_v3'

function loadSavedTasksMap(): Record<string, Task[]> | null {
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

function saveTasksMap(map: Record<string, Task[]>): void {
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

function loadSavedWorkspaces(): WorkspaceItem[] | null {
  try {
    const raw = localStorage.getItem(WORKSPACES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // ignore
  }
  return null
}

function saveWorkspaces(workspaces: WorkspaceItem[]): void {
  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces))
  } catch {
    // ignore
  }
}

function loadSavedActiveWorkspaceId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    return null
  }
}

function saveActiveWorkspaceId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
  } catch {
    // ignore
  }
}

interface TaskState {
  tasks: Task[]
  workspaceTasksMap: Record<string, Task[]>
  workspaces: WorkspaceItem[]
  activeWorkspace: WorkspaceItem | null
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  activeWorkspaceId: string | null

  // Search & Filter State
  searchQuery: string
  priorityFilter: string

  // Actions
  setSearchQuery: (query: string) => void
  setPriorityFilter: (priority: string) => void
  fetchTasks: (workspaceId?: string) => Promise<void>
  switchWorkspace: (workspace: WorkspaceItem) => Promise<void>
  addWorkspace: (workspace: WorkspaceItem) => void
  deleteWorkspace: (workspaceId: string) => void
  clearAllWorkspaces: () => void
  createTask: (data: CreateTaskDTO) => Promise<Task>
  updateTask: (
    taskId: string,
    data: {
      title?: string
      description?: string | null
      priority?: 'LOW' | 'MEDIUM' | 'HIGH'
      assigneeName?: string | null
    },
  ) => Promise<Task | null>
  updateTaskStatusOptimistic: (
    taskId: string,
    newStatus: 'TODO' | 'IN_PROGRESS' | 'DONE',
  ) => Promise<void>
  deleteTask: (taskId: string) => Promise<void>
  setTasks: (tasks: Task[]) => void
}

function initWorkspacesState(): {
  workspaces: WorkspaceItem[]
  activeWorkspace: WorkspaceItem | null
  activeWorkspaceId: string | null
  tasksMap: Record<string, Task[]>
} {
  try {
    if (!localStorage.getItem(WORKSPACE_RESET_FLAG_KEY)) {
      localStorage.setItem(WORKSPACE_RESET_FLAG_KEY, 'true')
      localStorage.removeItem(WORKSPACES_STORAGE_KEY)
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
      localStorage.removeItem(TASKS_STORAGE_KEY)
      return {
        workspaces: [],
        activeWorkspace: null,
        activeWorkspaceId: null,
        tasksMap: {},
      }
    }
  } catch {
    // ignore
  }

  const savedWorkspaces = loadSavedWorkspaces() || []
  const savedTasksMap = loadSavedTasksMap() || {}
  const savedActiveId = loadSavedActiveWorkspaceId()
  const activeWs =
    (savedActiveId && savedWorkspaces.find((w) => w.id === savedActiveId)) ||
    savedWorkspaces[0] ||
    null

  return {
    workspaces: savedWorkspaces,
    activeWorkspace: activeWs,
    activeWorkspaceId: activeWs ? activeWs.id : null,
    tasksMap: savedTasksMap,
  }
}

const initialData = initWorkspacesState()

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks:
    (initialData.activeWorkspaceId &&
      initialData.tasksMap[initialData.activeWorkspaceId]) ||
    [],
  workspaceTasksMap: initialData.tasksMap,
  workspaces: initialData.workspaces,
  activeWorkspace: initialData.activeWorkspace,
  isLoading: false,
  isSubmitting: false,
  error: null,
  activeWorkspaceId: initialData.activeWorkspaceId,

  searchQuery: '',
  priorityFilter: 'ALL',

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setPriorityFilter: (priority: string) => set({ priorityFilter: priority }),

  setTasks: (tasks: Task[]) => {
    const wsId = get().activeWorkspaceId
    if (!wsId) {
      set({ tasks })
      return
    }
    const newMap = {
      ...get().workspaceTasksMap,
      [wsId]: tasks,
    }
    set({
      tasks,
      workspaceTasksMap: newMap,
    })
    saveTasksMap(newMap)
  },

  switchWorkspace: async (workspace: WorkspaceItem) => {
    saveActiveWorkspaceId(workspace.id)
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
    saveActiveWorkspaceId(newWs.id)
    const updatedWorkspaces = [...get().workspaces, newWs]
    const updatedMap = {
      ...get().workspaceTasksMap,
      [newWs.id]: [],
    }
    set({
      workspaces: updatedWorkspaces,
      workspaceTasksMap: updatedMap,
      activeWorkspace: newWs,
      activeWorkspaceId: newWs.id,
      tasks: [],
    })
    saveWorkspaces(updatedWorkspaces)
    saveTasksMap(updatedMap)
  },

  deleteWorkspace: (workspaceId: string) => {
    const currentWorkspaces = get().workspaces
    const remainingWorkspaces = currentWorkspaces.filter(
      (w) => w.id !== workspaceId,
    )
    const updatedMap = { ...get().workspaceTasksMap }
    delete updatedMap[workspaceId]

    let newActive: WorkspaceItem | null = null
    let newActiveId: string | null = null

    if (remainingWorkspaces.length > 0) {
      if (get().activeWorkspaceId === workspaceId) {
        newActive = remainingWorkspaces[0]
        newActiveId = newActive.id
      } else {
        newActive = get().activeWorkspace
        newActiveId = get().activeWorkspaceId
      }
    }

    if (newActiveId) {
      saveActiveWorkspaceId(newActiveId)
    } else {
      try {
        localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
      } catch {
        // ignore
      }
    }

    const newTasks = (newActiveId && updatedMap[newActiveId]) || []

    set({
      workspaces: remainingWorkspaces,
      workspaceTasksMap: updatedMap,
      activeWorkspace: newActive,
      activeWorkspaceId: newActiveId,
      tasks: newTasks,
    })

    saveWorkspaces(remainingWorkspaces)
    saveTasksMap(updatedMap)

    if (newActiveId === DEFAULT_WORKSPACE_ID) {
      void get().fetchTasks(DEFAULT_WORKSPACE_ID)
    }
  },

  clearAllWorkspaces: () => {
    set({
      workspaces: [],
      workspaceTasksMap: {},
      activeWorkspace: null,
      activeWorkspaceId: null,
      tasks: [],
    })
    saveWorkspaces([])
    saveTasksMap({})
    try {
      localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
    } catch {
      // ignore
    }
  },

  fetchTasks: async (workspaceId = get().activeWorkspaceId ?? undefined) => {
    if (!workspaceId) {
      set({ tasks: [], isLoading: false })
      return
    }
    set({ isLoading: true, error: null })
    try {
      if (workspaceId === DEFAULT_WORKSPACE_ID) {
        const tasks = await taskService.getTasks(workspaceId)
        const updatedMap = {
          ...get().workspaceTasksMap,
          [DEFAULT_WORKSPACE_ID]: tasks,
        }
        set({
          tasks,
          isLoading: false,
          workspaceTasksMap: updatedMap,
        })
        saveTasksMap(updatedMap)
      } else {
        const cached = get().workspaceTasksMap[workspaceId] || []
        set({ tasks: cached, isLoading: false })
      }
    } catch (err: unknown) {
      // In case of network error, retrieve cached tasks from localStorage
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
    if (!activeWsId) {
      set({ isSubmitting: false, error: 'No active workspace' })
      throw new Error('No active workspace')
    }
    const trimmedName = data.assigneeName?.trim()

    try {
      if (activeWsId === DEFAULT_WORKSPACE_ID) {
        const newTask = await taskService.createTask(data, activeWsId)
        const updated = [newTask, ...get().tasks]
        const updatedMap = {
          ...get().workspaceTasksMap,
          [activeWsId]: updated,
        }
        set({
          tasks: updated,
          workspaceTasksMap: updatedMap,
          isSubmitting: false,
        })
        saveTasksMap(updatedMap)
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
          assigneeId: trimmedName ? `assignee-${Date.now()}` : null,
          assignee: trimmedName
            ? { id: `assignee-${Date.now()}`, name: trimmedName, email: '' }
            : null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        const updated = [localTask, ...get().tasks]
        const updatedMap = {
          ...get().workspaceTasksMap,
          [activeWsId]: updated,
        }
        set({
          tasks: updated,
          workspaceTasksMap: updatedMap,
          isSubmitting: false,
        })
        saveTasksMap(updatedMap)
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
        assigneeId: trimmedName ? `assignee-${Date.now()}` : null,
        assignee: trimmedName
          ? { id: `assignee-${Date.now()}`, name: trimmedName, email: '' }
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const updated = [localTask, ...get().tasks]
      const updatedMap = {
        ...get().workspaceTasksMap,
        [activeWsId]: updated,
      }
      set({
        tasks: updated,
        workspaceTasksMap: updatedMap,
        isSubmitting: false,
      })
      saveTasksMap(updatedMap)
      return localTask
    }
  },

  updateTask: async (taskId, data) => {
    set({ isSubmitting: true, error: null })
    const activeWsId = get().activeWorkspaceId
    if (!activeWsId) {
      set({ isSubmitting: false })
      return null
    }
    const previousTasks = get().tasks

    // 1. Optimistic update
    const updatedTasks = previousTasks.map((t) => {
      if (t.id !== taskId) return t
      return {
        ...t,
        title: data.title !== undefined ? data.title : t.title,
        description:
          data.description !== undefined ? data.description : t.description,
        priority: data.priority !== undefined ? data.priority : t.priority,
        assignee:
          data.assigneeName !== undefined
            ? data.assigneeName?.trim()
              ? {
                  id: t.assignee?.id || `assignee-${Date.now()}`,
                  name: data.assigneeName.trim(),
                  email: t.assignee?.email || '',
                }
              : null
            : t.assignee,
      }
    })

    const updatedMap = {
      ...get().workspaceTasksMap,
      [activeWsId]: updatedTasks,
    }
    set({
      tasks: updatedTasks,
      workspaceTasksMap: updatedMap,
    })
    saveTasksMap(updatedMap)

    // 2. Persist to server if DEFAULT_WORKSPACE_ID
    if (activeWsId === DEFAULT_WORKSPACE_ID) {
      try {
        const serverTask = await taskService.updateTask(
          taskId,
          data,
          activeWsId,
        )
        const finalTasks = get().tasks.map((t) =>
          t.id === taskId ? serverTask : t,
        )
        const finalMap = {
          ...get().workspaceTasksMap,
          [activeWsId]: finalTasks,
        }
        set({
          tasks: finalTasks,
          workspaceTasksMap: finalMap,
          isSubmitting: false,
        })
        saveTasksMap(finalMap)
        return serverTask
      } catch (err) {
        set({
          isSubmitting: false,
          error:
            err instanceof Error ? err.message : 'Failed to update task on server',
        })
        const updatedTask = updatedTasks.find((t) => t.id === taskId)
        return updatedTask || null
      }
    } else {
      set({ isSubmitting: false })
      const updatedTask = updatedTasks.find((t) => t.id === taskId)
      return updatedTask || null
    }
  },

  updateTaskStatusOptimistic: async (taskId, newStatus) => {
    const previousTasks = get().tasks
    const activeWsId = get().activeWorkspaceId
    if (!activeWsId) return
    const targetTask = previousTasks.find((t) => t.id === taskId)
    if (!targetTask || targetTask.status === newStatus) return

    // 1. Optimistic UI update: update local state immediately
    const updatedTasks = previousTasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t,
    )
    const updatedMap = {
      ...get().workspaceTasksMap,
      [activeWsId]: updatedTasks,
    }
    set({
      tasks: updatedTasks,
      workspaceTasksMap: updatedMap,
    })
    saveTasksMap(updatedMap)

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
    if (!activeWsId) return
    const updatedTasks = previousTasks.filter((t) => t.id !== taskId)
    const updatedMap = {
      ...get().workspaceTasksMap,
      [activeWsId]: updatedTasks,
    }

    set({
      tasks: updatedTasks,
      workspaceTasksMap: updatedMap,
    })
    saveTasksMap(updatedMap)

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
