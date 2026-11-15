// @author  veera
// @file    features/reminders/api.ts

import api from '@/api/client'
import type { PersonalReminder } from '@/types/models'

export async function listReminders(): Promise<PersonalReminder[]> {
  const r = await api.get<PersonalReminder[]>('/api/reminders/personal')
  return r.data
}

export async function addReminder(body: { text: string; due_date: string; remind_time?: string }): Promise<PersonalReminder> {
  const r = await api.post<PersonalReminder>('/api/reminders/personal', body)
  return r.data
}

export async function toggleReminder(id: number) {
  await api.patch(`/api/reminders/personal/${id}/done`)
}

export async function deleteReminder(id: number) {
  await api.delete(`/api/reminders/personal/${id}`)
}
