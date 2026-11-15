// @author  veera
// @file    features/tasks/api.ts

import api from '@/api/client'
import type { Task } from '@/types/models'

export async function getTasks(entityId: string): Promise<Task[]> {
  const r = await api.get<Task[]>(`/api/entities/${entityId}/tasks`)
  return r.data
}

export async function getAllTasks(entityId: string): Promise<Task[]> {
  const r = await api.get<Task[]>(`/api/entities/${entityId}/tasks/all`)
  return r.data
}

export interface TaskCreateInput {
  title: string
  description?: string
  assignee_id: number
  due_date: string
  status?: 'todo' | 'in_progress' | 'pending' | 'done'
  priority?: 'low' | 'medium' | 'high' | 'critical'
  phase?: 'preparation' | 'review' | 'submission' | 'approval'
  reminder?: { days_before: number; time: string; email: string } | null
  recurrence?: { frequency: 'weekly' | 'monthly' | 'quarterly'; day_of_month?: number } | null
}

export interface TaskPatch {
  title?: string
  description?: string
  status?: 'todo' | 'in_progress' | 'pending' | 'done'
  assignee_id?: number
  due_date?: string
  priority?: 'low' | 'medium' | 'high' | 'critical'
  phase?: 'preparation' | 'review' | 'submission' | 'approval'
}

export async function createTask(entityId: string, body: TaskCreateInput): Promise<Task> {
  const r = await api.post<Task>(`/api/entities/${entityId}/tasks`, body)
  return r.data
}

export async function updateTask(entityId: string, taskId: number, body: TaskPatch): Promise<Task> {
  const r = await api.patch<Task>(`/api/entities/${entityId}/tasks/${taskId}`, body)
  return r.data
}

export async function deleteTask(entityId: string, taskId: number): Promise<void> {
  await api.delete(`/api/entities/${entityId}/tasks/${taskId}`)
}
