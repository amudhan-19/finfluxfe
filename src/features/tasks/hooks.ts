// @author  veera
// @file    features/tasks/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as tasksApi from './api'

export function useTasks(entityId: string | null) {
  return useQuery({
    queryKey: ['tasks', entityId],
    queryFn: () => tasksApi.getTasks(entityId!),
    enabled: !!entityId,
  })
}

export function useAllTasks(entityId: string | null) {
  return useQuery({
    queryKey: ['tasks', entityId, 'all'],
    queryFn: () => tasksApi.getAllTasks(entityId!),
    enabled: !!entityId,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, body }: { entityId: string; body: tasksApi.TaskCreateInput }) =>
      tasksApi.createTask(entityId, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['tasks', v.entityId] }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, taskId, body }:
      { entityId: string; taskId: number; body: tasksApi.TaskPatch }) =>
      tasksApi.updateTask(entityId, taskId, body),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['tasks', v.entityId] }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ entityId, taskId }: { entityId: string; taskId: number }) =>
      tasksApi.deleteTask(entityId, taskId),
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ['tasks', v.entityId] }),
  })
}
