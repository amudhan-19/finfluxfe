// @author  veera
// @file    features/admin-support/components/TicketForm.tsx

import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import * as supportApi from '@/features/admin-support/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import type { SupportPriority } from '@/features/admin-support/types'

const PRIORITY_UI: Array<{ key: SupportPriority; label: string }> = [
  { key: 'low', label: 'Low' },
  { key: 'medium', label: 'Medium' },
  { key: 'high', label: 'High' },
  { key: 'critical', label: 'Critical' },
]

export function TicketForm() {
  const { toast } = useUiStore()
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<SupportPriority>('medium')
  const [description, setDescription] = useState('')

  const submit = useMutation({
    mutationFn: () =>
      supportApi.createSupportTicket({
        subject: subject.trim(),
        description: description.trim(),
        priority,
      }),
    onSuccess: (res) => {
      toast(`${res.message} Ref ${res.reference}`)
      setSubject('')
      setDescription('')
      setPriority('medium')
    },
    onError: (e: unknown) => {
      toast(getApiErrorMessage(e, 'Could not submit ticket.'))
    },
  })

  const canSubmit = subject.trim().length > 0 && description.trim().length > 0

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!canSubmit || submit.isPending) return
    submit.mutate()
  }

  return (
    <form className="support-card support-ticket" onSubmit={onSubmit}>
      <h3 className="support-card__title">Raise a Ticket</h3>

      <div className="support-ticket__body">
      <label className="support-field">
        <span className="support-field__label">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Ontology mapping not pulling from SAP"
          className="support-field__input"
          maxLength={200}
        />
      </label>

      <div className="support-field">
        <span className="support-field__label">Priority</span>
        <div className="support-priority" role="group" aria-label="Ticket priority">
          {PRIORITY_UI.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              disabled={submit.isPending}
              onClick={() => setPriority(key)}
              className={[
                'support-priority__btn',
                priority === key ? 'support-priority__btn--active' : '',
                `support-priority__btn--${key}`,
              ].filter(Boolean).join(' ')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <label className="support-field support-field--grow">
        <span className="support-field__label">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the issue…"
          rows={5}
          className="support-field__input support-field__textarea"
          maxLength={8000}
        />
      </label>
      </div>

      <button
        type="submit"
        disabled={!canSubmit || submit.isPending}
        className="support-ticket__submit"
      >
        {submit.isPending ? 'Submitting…' : 'Submit Ticket'}
      </button>
    </form>
  )
}
