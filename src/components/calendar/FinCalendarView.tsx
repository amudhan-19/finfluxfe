// @author  veera
// @file    components/calendar/FinCalendarView.tsx
//
// Three-view calendar (grid / timeline / tasklist) with task create + batch
// create + reassign actions. Reminders panel preserved.

import { useMemo, useState } from 'react'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import ChevronLeftOutlined from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlined from '@mui/icons-material/ChevronRightOutlined'
import CloseOutlined from '@mui/icons-material/CloseOutlined'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import FormatListBulletedOutlined from '@mui/icons-material/FormatListBulletedOutlined'
import NotificationsActiveOutlined from '@mui/icons-material/NotificationsActiveOutlined'
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined'
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined'
import ViewTimelineOutlined from '@mui/icons-material/ViewTimelineOutlined'
import { useEntities } from '@/features/entities/hooks'
import {
  useTasks, useUpdateTask, useDeleteTask, useCreateTask,
} from '@/features/tasks/hooks'
import {
  useReminders, useAddReminder, useToggleReminder, useDeleteReminder,
} from '@/features/reminders/hooks'
import { useUiStore } from '@/store/useUiStore'
import { useAuth } from '@/features/auth/AuthProvider'
import { canManageTasks } from '@/utils/rbac'
import { U } from '@/constants/uiText'
import { fmtD, fmtDFull, fmtDLong, fmtDateRange, duePhrase, dueInfo } from '@/utils/helpers'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { AppCard } from '@/components/ui/AppCard'
import { AppModal } from '@/components/ui/AppModal'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { FormDatePicker } from '@/components/ui/FormDatePicker'
import { FormSelect } from '@/components/ui/FormSelect'
import { FormTextField } from '@/components/ui/FormTextField'
import { FormTimePicker } from '@/components/ui/FormTimePicker'
import { PageHeader } from '@/components/ui/PageHeader'
import type { Task, EntityListItem, UserOut } from '@/types/models'
import type { DueInfo } from '@/utils/helpers'

type CalView = 'calendar' | 'timeline' | 'tasklist'
type Priority = Task['priority']
type Phase = Task['phase']

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const PHASE_LABELS: Record<Phase, string> = {
  preparation: 'Preparation',
  review: 'Review',
  submission: 'Submission',
  approval: 'Approval',
}

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
]

const PHASE_OPTIONS: { value: Phase; label: string }[] = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'review', label: 'Review' },
  { value: 'submission', label: 'Submission' },
  { value: 'approval', label: 'Approval' },
]

const ST_LABELS: Record<Task['status'], string> = {
  done: 'Done',
  in_progress: 'In Progress',
  pending: 'Pending',
  todo: 'To Do',
}

const ST_BADGE: Record<Task['status'], 'success' | 'info' | 'warning' | 'neutral'> = {
  done: 'success',
  in_progress: 'info',
  pending: 'warning',
  todo: 'neutral',
}

function priorityBadgeVariant(p: Priority): 'info' | 'warning' | 'danger' | 'neutral' {
  if (p === 'low') return 'info'
  if (p === 'medium') return 'warning'
  if (p === 'high') return 'warning'
  return 'danger'
}

function avatarTone(seed: string | number): number {
  const n = typeof seed === 'number' ? seed : seed.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return n % 6
}

function dueBadgeVariant(di: DueInfo): 'danger' | 'warning' | 'success' | 'neutral' {
  if (di.over) return 'danger'
  if (di.l.includes('left')) return 'warning'
  if (di.l === '—') return 'neutral'
  return 'success'
}

function dueDateClass(di: DueInfo): string {
  if (di.over) return 'cal-timeline__date-main--overdue'
  if (di.l.includes('left')) return 'cal-timeline__date-main--soon'
  return 'cal-timeline__date-main--ok'
}

function dueDateSubClass(di: DueInfo): string {
  if (di.over) return 'cal-timeline__date-sub--overdue'
  if (di.l.includes('left')) return 'cal-timeline__date-sub--soon'
  return 'cal-timeline__date-sub--ok'
}

function fmtDateKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function buildCalendarCells(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()
  const cells: Array<{ date: Date; muted: boolean }> = []

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), muted: true })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), muted: false })
  }
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, nextDay), muted: true })
    nextDay += 1
  }
  return cells
}

function teamFor(ent: EntityListItem): UserOut[] {
  const list: UserOut[] = []
  ;(ent.assignees || []).forEach((a) => list.push(a))
  if (ent.supervisor) list.push(ent.supervisor)
  if (ent.director) list.push(ent.director)
  const seen = new Set<number>()
  return list.filter((u) => (seen.has(u.id) ? false : (seen.add(u.id), true)))
}

export default function FinCalendarView() {
  const { user } = useAuth()
  const { selCo, setSelCo, toast } = useUiStore()
  const { data: entities = [] } = useEntities()

  const entityId = selCo || entities[0]?.id || null
  const { data: tasks = [], isLoading } = useTasks(entityId)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const createTask = useCreateTask()

  const { data: reminders = [] } = useReminders()
  const addRem = useAddReminder()
  const toggleRem = useToggleReminder()
  const delRem = useDeleteReminder()

  const [newTaskOpen, setNewTaskOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [newRemOpen, setNewRemOpen] = useState(false)
  const [reassignTask, setReassignTask] = useState<Task | null>(null)

  const today = new Date()
  const [view, setView] = useState<CalView>('calendar')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const role = user!.role
  const canManage = canManageTasks(role)

  const myTasks = useMemo(
    () => tasks.filter((t) => role === 'analyst' ? t.assignee.id === user!.id : true),
    [tasks, role, user],
  )
  const ent = entities.find((e) => e.id === entityId) || null

  const entityOptions = entities.map((e) => ({ value: e.id, label: e.name }))

  const taskStats = useMemo(() => {
    let overdue = 0, pending = 0, done = 0
    myTasks.forEach((t) => {
      if (t.status === 'done') { done += 1; return }
      const days = t.due_date
        ? Math.ceil((new Date(t.due_date).getTime() - Date.now()) / 864e5)
        : null
      if (days !== null && days < 0) overdue += 1
      else pending += 1
    })
    return { overdue, pending, done }
  }, [myTasks])

  const activeReminders = useMemo(
    () => reminders.filter((r) => !r.is_done).length,
    [reminders],
  )
  const closeDate = ent?.sub_due_date || ent?.rev_due_date || null

  return (
    <div className="fin-calendar">
      <div className="fin-calendar__header">
        <PageHeader
          title="FinCalendar"
          subtitle={(
            <>
              Month-End Close {U.mid} Task Management
              {ent ? (
                <>
                  {' '}
                  <span className="fin-calendar__header-entity">{U.mid} {ent.name}</span>
                </>
              ) : null}
            </>
          )}
          icon={<CalendarMonthOutlined sx={{ fontSize: 24 }} />}
          actions={(
            <div className="fin-calendar__toolbar">
              <div className="fin-calendar__field fin-calendar__field--entity">
                <label className="fin-calendar__field-label" htmlFor="fin-calendar-entity">
                  Entity
                </label>
                <div className="fin-calendar__entity-select">
                  <FilterSelect
                    id="fin-calendar-entity"
                    className="fin-calendar-entity-select"
                    value={entityId || ''}
                    onChange={(v) => setSelCo(v || null)}
                    placeholder="Select entity"
                    aria-label="Select entity"
                    options={entityOptions}
                  />
                </div>
              </div>

              <span className="fin-calendar__toolbar-divider" aria-hidden />

              <div className="fin-calendar__toolbar-group">
                <span className="fin-calendar__toolbar-label">View</span>
                <div className="fin-calendar__view-switch" role="tablist" aria-label="Calendar view">
                  {([
                    { id: 'calendar' as const, l: 'Cal', t: 'Calendar', icon: <CalendarMonthOutlined sx={{ fontSize: 17 }} /> },
                    { id: 'timeline' as const, l: 'Line', t: 'Timeline', icon: <ViewTimelineOutlined sx={{ fontSize: 17 }} /> },
                    { id: 'tasklist' as const, l: 'List', t: 'Task list', icon: <FormatListBulletedOutlined sx={{ fontSize: 17 }} /> },
                  ]).map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      role="tab"
                      title={v.t}
                      aria-selected={view === v.id}
                      className={`fin-calendar__view-btn${view === v.id ? ' fin-calendar__view-btn--active' : ''}`}
                      onClick={() => setView(v.id)}
                    >
                      <span className="fin-calendar__view-icon" aria-hidden>{v.icon}</span>
                      <span className="fin-calendar__view-label">{v.l}</span>
                    </button>
                  ))}
                </div>
              </div>

              <span className="fin-calendar__toolbar-divider" aria-hidden />

              <div className="fin-calendar__toolbar-group fin-calendar__actions">
                {canManage && entityId ? (
                  <>
                    <AppButton variant="primary" size="sm" onClick={() => setNewTaskOpen(true)}>
                      + Task
                    </AppButton>
                    <AppButton variant="secondary" size="sm" onClick={() => setBatchOpen(true)}>
                      + Batch
                    </AppButton>
                  </>
                ) : null}
                <AppButton variant="outline" size="sm" onClick={() => setNewRemOpen(true)}>
                  + Reminder
                </AppButton>
              </div>
            </div>
          )}
        />
      </div>

      <div className="fin-calendar__stats">
        <CalStat tone="neutral" label="Close Date" value={closeDate ? fmtDFull(closeDate) : '—'} />
        <CalStat tone="over" label="Overdue" value={taskStats.overdue} unit="tasks" />
        <CalStat tone="soon" label="Pending" value={taskStats.pending} unit="tasks" />
        <CalStat tone="ok" label="Completed" value={taskStats.done} unit="tasks" />
        <CalStat tone="info" label="Reminders" value={activeReminders} unit="active" />
      </div>

      <div className="fin-calendar__layout">
        <div className="fin-calendar__main">
          {view === 'calendar' ? (
            <CalendarGridView
              tasks={myTasks}
              year={year}
              month={month}
              onPrev={() => {
                if (month === 0) { setMonth(11); setYear(year - 1) } else setMonth(month - 1)
              }}
              onNext={() => {
                if (month === 11) { setMonth(0); setYear(year + 1) } else setMonth(month + 1)
              }}
              onGoToday={() => {
                setYear(today.getFullYear())
                setMonth(today.getMonth())
              }}
            />
          ) : null}
          {view === 'timeline' ? <TimelineView tasks={myTasks} /> : null}
          {view === 'tasklist' ? (
            <AppCard title={`Tasks (${myTasks.length})`} flush>
              {isLoading ? (
                <EmptyState title={`Loading${U.ellip}`} />
              ) : myTasks.length === 0 ? (
                <EmptyState title="No tasks" description="Tasks for this entity will appear here." />
              ) : (
                <div className="cal-task-list">
                  {myTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      t={t}
                      canManage={canManage}
                      onToggle={(s) => updateTask.mutate({ entityId: entityId!, taskId: t.id, body: { status: s } })}
                      onDelete={() => deleteTask.mutate({ entityId: entityId!, taskId: t.id })}
                      onReassign={() => setReassignTask(t)}
                    />
                  ))}
                </div>
              )}
            </AppCard>
          ) : null}
        </div>

        <AppCard
          title={reminders.length ? `My Reminders (${reminders.length})` : 'My Reminders'}
          className="cal-reminders"
          flush
        >
          {reminders.length === 0 ? (
            <EmptyState
              icon={<NotificationsNoneOutlined sx={{ fontSize: 24 }} />}
              title="No reminders yet"
              description="Create a reminder to stay on top of close tasks."
              actionLabel="+ Reminder"
              onAction={() => setNewRemOpen(true)}
            />
          ) : (
            reminders.map((r) => {
              const rdi = dueInfo(r.due_date)
              const tone = rdi.over ? 'over' : rdi.l.includes('left') ? 'soon' : 'ok'
              return (
                <div
                  key={r.id}
                  className={`cal-reminders__item${r.is_done ? ' cal-reminders__item--done' : ''}`}
                >
                  <span className="cal-reminders__icon" aria-hidden>
                    <NotificationsActiveOutlined sx={{ fontSize: 16 }} />
                  </span>
                  <div className="cal-reminders__body">
                    <div className={`cal-reminders__text${r.is_done ? ' cal-reminders__text--done' : ''}`}>
                      {r.text}
                    </div>
                    <div className="cal-reminders__meta">
                      <span className="cal-reminders__meta-item">
                        <EventNoteOutlined sx={{ fontSize: 13 }} />
                        {fmtDFull(r.due_date)}
                      </span>
                      {r.remind_time ? (
                        <span className="cal-reminders__meta-item">
                          <ScheduleOutlined sx={{ fontSize: 13 }} />
                          {r.remind_time}
                        </span>
                      ) : null}
                    </div>
                    {r.is_done ? (
                      <span className="cal-reminders__tag cal-reminders__tag--done">Completed</span>
                    ) : (
                      <span className={`cal-reminders__tag cal-reminders__tag--${tone}`}>
                        {duePhrase(r.due_date)}
                      </span>
                    )}
                  </div>
                  <div className="cal-reminders__actions">
                    <input
                      type="checkbox"
                      className="cal-reminders__check"
                      checked={r.is_done}
                      onChange={() => toggleRem.mutate(r.id)}
                      aria-label={r.is_done ? 'Mark reminder incomplete' : 'Mark reminder complete'}
                    />
                    <button
                      type="button"
                      className="cal-reminders__delete"
                      onClick={() => delRem.mutate(r.id)}
                      aria-label="Delete reminder"
                    >
                      <CloseOutlined sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </AppCard>
      </div>

      {newTaskOpen && entityId && ent ? (
        <NewTaskModal
          ent={ent}
          onClose={() => setNewTaskOpen(false)}
          onCreate={(body) => {
            createTask.mutate({ entityId, body }, {
              onSuccess: () => { toast('Task created'); setNewTaskOpen(false) },
            })
          }}
        />
      ) : null}

      {batchOpen && entityId && ent ? (
        <BatchTaskModal
          ent={ent}
          onClose={() => setBatchOpen(false)}
          onCreateAll={async (rows) => {
            for (const body of rows) {
              try { await createTask.mutateAsync({ entityId, body }) }
              catch (e) { console.error(e) }
            }
            toast(`Created ${rows.length} task(s)`)
            setBatchOpen(false)
          }}
        />
      ) : null}

      {newRemOpen ? (
        <NewReminderModal
          onClose={() => setNewRemOpen(false)}
          onCreate={(body) => {
            addRem.mutate(body, { onSuccess: () => { toast('Reminder added'); setNewRemOpen(false) } })
          }}
        />
      ) : null}

      {reassignTask && entityId && ent ? (
        <ReassignModal
          task={reassignTask}
          ent={ent}
          onClose={() => setReassignTask(null)}
          onSave={(assignee_id) => {
            updateTask.mutate({ entityId, taskId: reassignTask.id, body: { assignee_id } }, {
              onSuccess: () => { toast('Reassigned'); setReassignTask(null) },
            })
          }}
        />
      ) : null}
    </div>
  )
}

function CalendarGridView({
  tasks,
  year,
  month,
  onPrev,
  onNext,
  onGoToday,
}: {
  tasks: Task[]
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onGoToday: () => void
}) {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const cells = useMemo(() => buildCalendarCells(year, month), [year, month])
  const todayKey = fmtDateKey(new Date())
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()
  const monthRange = useMemo(
    () => fmtDateRange(new Date(year, month, 1), new Date(year, month + 1, 0)),
    [year, month],
  )

  const taskByDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks.forEach((t) => {
      const k = (t.due_date || '').slice(0, 10)
      if (!map[k]) map[k] = []
      map[k].push(t)
    })
    return map
  }, [tasks])

  const monthTaskCount = useMemo(() => {
    return cells
      .filter((c) => !c.muted)
      .reduce((sum, c) => sum + (taskByDay[fmtDateKey(c.date)]?.length ?? 0), 0)
  }, [cells, taskByDay])

  // Default the detail strip to today when viewing the current month, so the
  // selected-day panel is never empty / unexplained on first load.
  const activeKey = selectedDay ?? (isCurrentMonth ? todayKey : null)
  const activeTasks = activeKey ? (taskByDay[activeKey] || []) : []

  return (
    <div className="cal-grid">
      <div className="cal-grid__nav">
        <div className="cal-grid__nav-left">
          <button
            type="button"
            className="cal-grid__today-btn"
            onClick={onGoToday}
            disabled={isCurrentMonth}
          >
            Today
          </button>
          <div className="cal-grid__stepper">
            <button type="button" className="cal-grid__nav-btn" onClick={onPrev} aria-label="Previous month">
              <ChevronLeftOutlined sx={{ fontSize: 20 }} />
            </button>
            <button type="button" className="cal-grid__nav-btn" onClick={onNext} aria-label="Next month">
              <ChevronRightOutlined sx={{ fontSize: 20 }} />
            </button>
          </div>
          <div className="cal-grid__nav-title">
            <h2 className="cal-grid__month">{MONTHS[month]} {year}</h2>
            <span className="cal-grid__month-range">{monthRange}</span>
          </div>
        </div>
        <div className="cal-grid__nav-right">
          <span className="cal-grid__month-meta">
            {monthTaskCount} task{monthTaskCount === 1 ? '' : 's'} this month
          </span>
        </div>
      </div>

      <div className="cal-grid__body">
        <div className="cal-grid__weekdays">
          {WEEKDAYS.map((d) => (
            <div key={d} className="cal-grid__weekday">{d}</div>
          ))}
        </div>

        <div className="cal-grid__cells">
          {cells.map((c, i) => {
            const k = fmtDateKey(c.date)
            const dayTasks = taskByDay[k] || []
            const isToday = k === todayKey
            const isWeekend = c.date.getDay() === 0 || c.date.getDay() === 6
            const isSelected = selectedDay === k

            return (
              <div
                key={`${k}-${i}`}
                role="button"
                tabIndex={0}
                className={[
                  'cal-grid__cell',
                  c.muted ? 'cal-grid__cell--muted' : '',
                  isWeekend ? 'cal-grid__cell--weekend' : '',
                  isToday ? 'cal-grid__cell--today' : '',
                  isSelected ? 'cal-grid__cell--selected' : '',
                  dayTasks.length > 0 ? ' cal-grid__cell--has-tasks' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setSelectedDay(k)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedDay(k) }}
                aria-label={`${c.date.toLocaleDateString()}, ${dayTasks.length} tasks`}
                aria-current={isToday ? 'date' : undefined}
              >
                <div className="cal-grid__cell-head">
                  {dayTasks.length > 0 && !c.muted ? (
                    <span
                      className="cal-grid__count"
                      title={`${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'}`}
                    >
                      {dayTasks.length}
                    </span>
                  ) : null}
                  <span className="cal-grid__day-num">{c.date.getDate()}</span>
                </div>
                <div className="cal-grid__tasks">
                  {dayTasks.slice(0, 3).map((t) => (
                    <CalendarTaskChip key={t.id} task={t} />
                  ))}
                  {dayTasks.length > 3 ? (
                    <button type="button" className="cal-grid__more">
                      +{dayTasks.length - 3} more
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="cal-grid__selected">
        <div className="cal-grid__selected-head">
          <span className="cal-grid__selected-label">
            {activeKey ? fmtDLong(activeKey) : 'Select a day'}
          </span>
          {activeKey ? (
            <span className="cal-grid__selected-count">
              {activeTasks.length} task{activeTasks.length === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        {!activeKey ? (
          <p className="cal-grid__selected-empty">Pick a day on the calendar to see its tasks.</p>
        ) : activeTasks.length === 0 ? (
          <p className="cal-grid__selected-empty">No tasks scheduled for this day.</p>
        ) : (
          <div className="cal-grid__selected-list">
            {activeTasks.map((t) => (
              <div
                key={t.id}
                className={`cal-grid__selected-task cal-grid__selected-task--phase-${t.phase}`}
              >
                <span className="cal-grid__selected-bar" aria-hidden />
                <span className={`cal-grid__selected-task-title${t.status === 'done' ? ' cal-grid__selected-task-title--done' : ''}`}>
                  {t.title}
                </span>
                <AppBadge variant={priorityBadgeVariant(t.priority)}>{t.priority}</AppBadge>
                <AppBadge variant={ST_BADGE[t.status]}>{ST_LABELS[t.status]}</AppBadge>
                <CalUserAvatar user={t.assignee} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarTaskChip({ task }: { task: Task }) {
  const done = task.status === 'done'
  return (
    <div
      className={[
        'cal-task-chip',
        `cal-task-chip--priority-${task.priority}`,
        `cal-task-chip--phase-${task.phase}`,
        done ? 'cal-task-chip--done' : '',
      ].filter(Boolean).join(' ')}
      title={`${task.title} ${U.mid} ${ST_LABELS[task.status]} ${U.mid} ${task.assignee.name}`}
    >
      <span className="cal-task-chip__bar" aria-hidden />
      <span className="cal-task-chip__title">{task.title}</span>
    </div>
  )
}

function TimelineView({ tasks }: { tasks: Task[] }) {
  const sorted = [...tasks].sort(
    (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
  )

  if (sorted.length === 0) {
    return (
      <AppCard title="Timeline" flush>
        <EmptyState
          icon={<EventNoteOutlined sx={{ fontSize: 24 }} />}
          title="No tasks"
          description="Tasks will appear on the timeline by due date."
        />
      </AppCard>
    )
  }

  return (
    <div className="cal-timeline">
      <div className="cal-timeline__head">
        <span className="cal-timeline__title">Timeline</span>
        <span className="cal-timeline__count">{sorted.length} tasks</span>
      </div>
      {sorted.map((t) => {
        const di = dueInfo(t.due_date)
        const done = t.status === 'done'
        const dow = t.due_date
          ? new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short' })
          : ''
        return (
          <div key={t.id} className="cal-timeline__row">
            <div className="cal-timeline__date" title={fmtDLong(t.due_date)}>
              <div className="cal-timeline__date-dow">{dow}</div>
              <div className={`cal-timeline__date-main ${dueDateClass(di)}`}>{fmtD(t.due_date)}</div>
              <div className={`cal-timeline__date-sub ${dueDateSubClass(di)}`}>{di.l}</div>
            </div>
            <div className={`cal-timeline__bar cal-phase-bar--${t.phase}`} />
            <div className="cal-timeline__content">
              <div className={`cal-timeline__task-title${done ? ' cal-timeline__task-title--done' : ''}`}>
                {t.title}
              </div>
              <div className="cal-timeline__meta">
                <AppBadge variant={priorityBadgeVariant(t.priority)}>{t.priority}</AppBadge>
                <AppBadge variant="neutral">{PHASE_LABELS[t.phase]}</AppBadge>
                <AppBadge variant={ST_BADGE[t.status]}>{ST_LABELS[t.status]}</AppBadge>
              </div>
            </div>
            <CalUserAvatar user={t.assignee} />
          </div>
        )
      })}
    </div>
  )
}

function TaskRow({
  t,
  canManage,
  onToggle,
  onDelete,
  onReassign,
}: {
  t: Task
  canManage: boolean
  onToggle: (s: Task['status']) => void
  onDelete: () => void
  onReassign: () => void
}) {
  const di = dueInfo(t.due_date)
  const done = t.status === 'done'

  return (
    <div className="cal-task-list__row">
      <input
        type="checkbox"
        className="cal-task-list__check"
        checked={done}
        onChange={(e) => onToggle(e.target.checked ? 'done' : 'todo')}
        aria-label={done ? 'Mark task incomplete' : 'Mark task complete'}
      />
      <span className={`cal-task-list__title${done ? ' cal-task-list__title--done' : ''}`}>{t.title}</span>
      <CalUserAvatar user={t.assignee} />
      <AppBadge variant={priorityBadgeVariant(t.priority)}>{t.priority}</AppBadge>
      <AppBadge variant="neutral">{PHASE_LABELS[t.phase]}</AppBadge>
      <AppBadge variant={dueBadgeVariant(di)}>{di.l}</AppBadge>
      {canManage ? (
        <div className="cal-task-list__actions">
          <AppButton variant="ghost" size="sm" onClick={onReassign} aria-label="Reassign task">
            Reassign
          </AppButton>
          <button
            type="button"
            className="cal-task-list__delete"
            onClick={onDelete}
            aria-label="Delete task"
          >
            <DeleteOutlined sx={{ fontSize: 18 }} />
          </button>
        </div>
      ) : null}
    </div>
  )
}

function CalStat({
  tone,
  label,
  value,
  unit,
}: {
  tone: 'neutral' | 'over' | 'soon' | 'ok' | 'info'
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className={`fin-calendar__stat fin-calendar__stat--${tone}`}>
      <span className="fin-calendar__stat-dot" aria-hidden />
      <div className="fin-calendar__stat-body">
        <span className="fin-calendar__stat-label">{label}</span>
        <span className="fin-calendar__stat-value">
          {value}
          {unit ? <em className="fin-calendar__stat-unit">{unit}</em> : null}
        </span>
      </div>
    </div>
  )
}

function CalUserAvatar({ user }: { user: UserOut }) {
  return (
    <span
      className={`cal-user-avatar cal-user-avatar--tone-${avatarTone(user.id)}`}
      title={user.name}
    >
      {user.initials}
    </span>
  )
}

function NewTaskModal({
  ent,
  onClose,
  onCreate,
}: {
  ent: EntityListItem
  onClose: () => void
  onCreate: (body: {
    title: string
    due_date: string
    priority: Priority
    phase: Phase
    assignee_id: number
    description?: string
  }) => void
}) {
  const candidates = teamFor(ent)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10))
  const [pri, setPri] = useState<Priority>('medium')
  const [phase, setPhase] = useState<Phase>('preparation')
  const [assigneeId, setAssigneeId] = useState<number | undefined>(candidates[0]?.id)

  const canSubmit = Boolean(title.trim() && assigneeId)

  return (
    <AppModal
      open
      title="New Task"
      subtitle={ent.name}
      onClose={onClose}
      footer={(
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="primary"
            disabled={!canSubmit}
            onClick={() => {
              if (!assigneeId) return
              onCreate({
                title: title.trim(),
                due_date: due,
                priority: pri,
                phase,
                assignee_id: assigneeId,
                ...(description.trim() ? { description: description.trim() } : {}),
              })
            }}
          >
            Create Task
          </AppButton>
        </>
      )}
    >
      <div className="cal-modal__section">
        <div className="cal-modal__section-title">Task Details</div>
        <FormTextField
          id="new-task-title"
          fieldLabel="Task title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
        />
        <FormTextField
          id="new-task-desc"
          fieldLabel="Description"
          fullWidth
          multiline
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />
      </div>

      <div className="cal-modal__section">
        <div className="cal-modal__section-title">Schedule &amp; Assignment</div>
        <div className="cal-modal__grid-2">
          <FormDatePicker
            id="new-task-due"
            fieldLabel="Due date"
            required
            value={due}
            onChange={setDue}
          />
          <FormSelect
            id="new-task-priority"
            fieldLabel="Priority"
            required
            value={pri}
            onChange={(e) => setPri(e.target.value as Priority)}
            options={PRIORITY_OPTIONS}
          />
          <FormSelect
            id="new-task-phase"
            fieldLabel="Phase"
            required
            value={phase}
            onChange={(e) => setPhase(e.target.value as Phase)}
            options={PHASE_OPTIONS}
          />
          <FormSelect
            id="new-task-assignee"
            fieldLabel="Assignee"
            required
            value={assigneeId ?? ''}
            onChange={(e) => setAssigneeId(Number(e.target.value))}
            options={candidates.map((u) => ({ value: u.id, label: u.name }))}
          />
        </div>
        <p className="cal-modal__entity-note">
          Entity: <strong>{ent.name}</strong> {U.mid} only its team can be assigned.
        </p>
      </div>

      {!canSubmit ? (
        <p className="cal-modal__hint">Task title and assignee are required.</p>
      ) : null}
    </AppModal>
  )
}

function BatchTaskModal({
  ent,
  onClose,
  onCreateAll,
}: {
  ent: EntityListItem
  onClose: () => void
  onCreateAll: (rows: Array<{
    title: string
    due_date: string
    priority: Priority
    phase: Phase
    assignee_id: number
  }>) => void
}) {
  const candidates = teamFor(ent)
  const blank = () => ({
    title: '',
    due_date: new Date().toISOString().slice(0, 10),
    priority: 'medium' as Priority,
    phase: 'preparation' as Phase,
    assignee_id: candidates[0]?.id as number | undefined,
  })
  const [rows, setRows] = useState([blank(), blank()])

  const set = (i: number, patch: Partial<ReturnType<typeof blank>>) => {
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  }
  const add = () => setRows((rs) => [...rs, blank()])
  const del = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i))

  const valid = rows.filter((r) => r.title.trim() && r.assignee_id)

  return (
    <AppModal
      open
      size="lg"
      title="Create Batch Tasks"
      subtitle={ent.name}
      onClose={onClose}
      footer={(
        <div className="cal-batch__footer">
          <span className="cal-batch__footer-meta">
            {valid.length}/{rows.length} valid row{rows.length === 1 ? '' : 's'}
          </span>
          <div className="cal-batch__footer-actions">
            <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
            <AppButton
              variant="primary"
              disabled={valid.length === 0}
              onClick={() => onCreateAll(valid as Array<{
                title: string
                due_date: string
                priority: Priority
                phase: Phase
                assignee_id: number
              }>)}
            >
              Create Batch ({valid.length})
            </AppButton>
          </div>
        </div>
      )}
    >
      <div className="cal-modal__section">
        <div className="cal-modal__section-title">Basic Details</div>
        <p className="cal-modal__hint">
          Add multiple tasks for <strong>{ent.name}</strong>. Each row creates one task with the same API payload as single task creation.
        </p>
      </div>

      <div className="cal-modal__section">
        <div className="cal-batch__section-head">
          <div className="cal-modal__section-title">Task List</div>
          <AppButton variant="outline" size="sm" className="cal-batch__add-row" onClick={add}>
            + Add another task
          </AppButton>
        </div>
        <div className="cal-batch__table-wrap">
          <table className="cal-batch__table">
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Due</th>
                <th scope="col">Priority</th>
                <th scope="col">Phase</th>
                <th scope="col">Assignee</th>
                <th scope="col" className="cal-batch__th-action" aria-label="Delete row" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <FormTextField
                      id={`batch-title-${i}`}
                      placeholder="Task title"
                      value={r.title}
                      onChange={(e) => set(i, { title: e.target.value })}
                      size="small"
                      fullWidth
                    />
                  </td>
                  <td>
                    <FormDatePicker
                      id={`batch-due-${i}`}
                      value={r.due_date}
                      onChange={(v) => set(i, { due_date: v })}
                    />
                  </td>
                  <td>
                    <FormSelect
                      id={`batch-pri-${i}`}
                      value={r.priority}
                      onChange={(e) => set(i, { priority: e.target.value as Priority })}
                      options={PRIORITY_OPTIONS}
                    />
                  </td>
                  <td>
                    <FormSelect
                      id={`batch-phase-${i}`}
                      value={r.phase}
                      onChange={(e) => set(i, { phase: e.target.value as Phase })}
                      options={PHASE_OPTIONS}
                    />
                  </td>
                  <td>
                    <FormSelect
                      id={`batch-assignee-${i}`}
                      value={r.assignee_id ?? ''}
                      onChange={(e) => set(i, { assignee_id: Number(e.target.value) })}
                      options={candidates.map((u) => ({ value: u.id, label: u.name }))}
                    />
                  </td>
                  <td className="cal-batch__td-action">
                    <button
                      type="button"
                      className="cal-batch__remove"
                      onClick={() => del(i)}
                      disabled={rows.length === 1}
                      aria-label="Delete row"
                    >
                      <DeleteOutlined sx={{ fontSize: 18 }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppModal>
  )
}

function ReassignModal({
  task,
  ent,
  onClose,
  onSave,
}: {
  task: Task
  ent: EntityListItem
  onClose: () => void
  onSave: (uid: number) => void
}) {
  const candidates = teamFor(ent)
  const [uid, setUid] = useState<number>(task.assignee.id)

  return (
    <AppModal
      open
      title="Reassign Task"
      subtitle={task.title}
      onClose={onClose}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
      primaryAction={{ label: 'Save', onClick: () => onSave(uid) }}
    >
      <FormSelect
        id="reassign-assignee"
        fieldLabel="New assignee"
        value={uid}
        onChange={(e) => setUid(Number(e.target.value))}
        options={candidates.map((u) => ({ value: u.id, label: `${u.name} (${u.initials})` }))}
      />
    </AppModal>
  )
}

function NewReminderModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (body: { text: string; due_date: string; remind_time?: string }) => void
}) {
  const [text, setText] = useState('')
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10))
  const [time, setTime] = useState('09:00')

  return (
    <AppModal
      open
      title="New Reminder"
      subtitle="Personal reminder"
      onClose={onClose}
      footer={(
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton
            variant="primary"
            disabled={!text.trim()}
            onClick={() => onCreate({
              text: text.trim(),
              due_date: due,
              ...(time ? { remind_time: time } : {}),
            })}
          >
            Add Reminder
          </AppButton>
        </>
      )}
    >
      <div className="cal-modal__section">
        <div className="cal-modal__section-title">Reminder Details</div>
        <FormTextField
          id="reminder-text"
          fieldLabel="Reminder title"
          required
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What do you need to remember?"
        />
      </div>

      <div className="cal-modal__section">
        <div className="cal-modal__section-title">Schedule</div>
        <div className="cal-modal__grid-2">
          <FormDatePicker
            id="reminder-date"
            fieldLabel="Date"
            required
            value={due}
            onChange={setDue}
          />
          <FormTimePicker
            id="reminder-time"
            fieldLabel="Time"
            value={time}
            onChange={setTime}
          />
        </div>
      </div>
    </AppModal>
  )
}
