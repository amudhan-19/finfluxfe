// @author  veera
// @file    features/admin-support/components/SupportChannels.tsx

import { useQuery } from '@tanstack/react-query'
import { BookOpen, Mail, Phone } from 'lucide-react'
import * as supportApi from '@/features/admin-support/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import type { SupportChannel } from '@/features/admin-support/types'

function channelIcon(id: string) {
  if (id === 'email') return <Mail size={24} strokeWidth={2} />
  if (id === 'phone') return <Phone size={24} strokeWidth={2} />
  return <BookOpen size={24} strokeWidth={2} />
}

function channelModifier(id: string): string {
  if (id === 'email' || id === 'phone' || id === 'docs' || id === 'knowledge') return id
  return 'default'
}

export function SupportChannels() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-support-channels'],
    queryFn: () => supportApi.getSupportChannels(),
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) {
    return (
      <section className="support-card support-channels-section" aria-busy="true">
        <header className="support-channels-section__header">
          <h3 className="support-card__title">Contact Channels</h3>
          <p className="support-channels-section__subtitle">Reach our team directly or browse documentation</p>
        </header>
        <div className="support-channels support-channels--loading">
          {[1, 2, 3].map((n) => (
            <div key={n} className="support-channels__skeleton" />
          ))}
        </div>
      </section>
    )
  }

  if (isError) {
    return (
      <section className="support-card support-channels-section">
        <header className="support-channels-section__header">
          <h3 className="support-card__title">Contact Channels</h3>
        </header>
        <div className="support-card__error">{getApiErrorMessage(error, 'Could not load contact channels.')}</div>
        <button type="button" className="support-card__retry" onClick={() => void refetch()}>
          Retry
        </button>
      </section>
    )
  }

  const channels = data ?? []

  if (channels.length === 0) {
    return (
      <section className="support-card support-channels-section">
        <header className="support-channels-section__header">
          <h3 className="support-card__title">Contact Channels</h3>
        </header>
        <div className="support-card__empty">No channels configured.</div>
      </section>
    )
  }

  return (
    <section className="support-card support-channels-section">
      <header className="support-channels-section__header">
        <h3 className="support-card__title">Contact Channels</h3>
        <p className="support-channels-section__subtitle">Reach our team directly or browse documentation</p>
      </header>
      <div className="support-channels">
        {channels.map((c: SupportChannel) => {
          const mod = channelModifier(c.id)
          return (
            <article
              key={c.id}
              className={`support-channels__card support-channels__card--${mod}`}
            >
              <div className="support-channels__icon-wrap" aria-hidden>
                {channelIcon(c.id)}
              </div>
              <h4 className="support-channels__label">{c.label}</h4>
              <p className="support-channels__value">{c.value}</p>
              <p className="support-channels__desc">{c.description}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}
