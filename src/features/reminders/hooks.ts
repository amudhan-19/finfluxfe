// @author  veera
// @file    features/reminders/hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as remApi from './api'

export function useReminders() {
  return useQuery({
    queryKey: ['reminders'],
    queryFn: () => remApi.listReminders(),
  })
}

export function useAddReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { text: string; due_date: string; remind_time?: string }) => remApi.addReminder(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useToggleReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remApi.toggleReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}

export function useDeleteReminder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => remApi.deleteReminder(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reminders'] }),
  })
}
