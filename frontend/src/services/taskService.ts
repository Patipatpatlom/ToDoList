import { apiClient } from './api'

export interface Assignee {
  id: string
  name: string
  email: string
}

export interface Task {
  id: string
  workspaceId: string
  title: string
  description?: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  assigneeId?: string | null
  assignee?: Assignee | null
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: 'LOW' | 'MEDIUM' | 'HIGH'
  assigneeId?: string
}

export const DEFAULT_WORKSPACE_ID = 'f52aa0b7-dcf1-4135-bc24-3c339e7044d0'

export const taskService = {
  /**
   * Fetch all tasks for a workspace
   */
  async getTasks(workspaceId: string = DEFAULT_WORKSPACE_ID): Promise<Task[]> {
    const response = await apiClient.get<{ success: boolean; data: Task[] }>(
      `/workspaces/${workspaceId}/tasks`,
    )
    return response.data.data
  },

  /**
   * Create a new task in a workspace
   */
  async createTask(
    data: CreateTaskDTO,
    workspaceId: string = DEFAULT_WORKSPACE_ID,
  ): Promise<Task> {
    const response = await apiClient.post<{ success: boolean; data: Task }>(
      `/workspaces/${workspaceId}/tasks`,
      data,
    )
    return response.data.data
  },

  /**
   * Update the status of a task
   */
  async updateTaskStatus(
    taskId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE',
    workspaceId: string = DEFAULT_WORKSPACE_ID,
  ): Promise<Task> {
    const response = await apiClient.patch<{ success: boolean; data: Task }>(
      `/workspaces/${workspaceId}/tasks/${taskId}/status`,
      { status },
    )
    return response.data.data
  },

  /**
   * Delete a task by ID
   */
  async deleteTask(
    taskId: string,
    workspaceId: string = DEFAULT_WORKSPACE_ID,
  ): Promise<void> {
    await apiClient.delete(`/workspaces/${workspaceId}/tasks/${taskId}`)
  },
}
