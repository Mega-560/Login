import { useMemo, useState, type FormEvent } from 'react'

const storageKey = 'nexusflow-admin-calendar-events'
const eventTypes = ['Meeting', 'Reminder', 'Launch', 'Other'] as const
type EventType = typeof eventTypes[number]

interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  type: EventType
  description: string
}

interface EventForm {
  title: string
  date: string
  time: string
  type: EventType
  description: string
}

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const emptyForm = (date: string): EventForm => ({
  title: '',
  date,
  time: '09:00',
  type: 'Meeting',
  description: '',
})

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function readEvents(): CalendarEvent[] {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? '[]')
    if (!Array.isArray(stored)) return []
    return stored.filter((event): event is CalendarEvent =>
      typeof event === 'object'
      && event !== null
      && 'id' in event && typeof event.id === 'string'
      && 'title' in event && typeof event.title === 'string'
      && 'date' in event && typeof event.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(event.date)
      && 'time' in event && typeof event.time === 'string'
      && 'type' in event && typeof event.type === 'string' && eventTypes.includes(event.type as EventType)
      && 'description' in event && typeof event.description === 'string')
  } catch {
    return []
  }
}

function formatEventDate(date: string, options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, options).format(new Date(year, month - 1, day))
}

function CalendarPage() {
  const today = localDateKey(new Date())
  const [events, setEvents] = useState<CalendarEvent[]>(readEvents)
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const date = new Date()
    return new Date(date.getFullYear(), date.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const [form, setForm] = useState<EventForm>(() => emptyForm(today))
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const calendarDays = useMemo(() => {
    const firstOfMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const mondayOffset = (firstOfMonth.getDay() + 6) % 7
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), index - mondayOffset + 1)
      return { date, key: localDateKey(date), inMonth: date.getMonth() === visibleMonth.getMonth() }
    })
  }, [visibleMonth])

  const upcomingEvents = useMemo(
    () => events
      .filter((event) => event.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)),
    [events, today],
  )

  const selectedDayEvents = useMemo(
    () => events.filter((event) => event.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [events, selectedDate],
  )

  function changeMonth(offset: number) {
    setVisibleMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1))
  }

  function selectCalendarDate(date: string) {
    setSelectedDate(date)
    setForm((current) => ({ ...current, date }))
  }

  function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    const nextEvent: CalendarEvent = {
      ...form,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: form.title.trim(),
      description: form.description.trim(),
    }
    const nextEvents = [...events, nextEvent]
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextEvents))
      setEvents(nextEvents)
      setSelectedDate(nextEvent.date)
      const [year, month] = nextEvent.date.split('-').map(Number)
      setVisibleMonth(new Date(year, month - 1, 1))
      setForm(emptyForm(nextEvent.date))
      setNotice('Event created and saved on this device.')
    } catch {
      setError('The event could not be saved in this browser. Check available local storage and try again.')
    }
  }

  function deleteEvent(eventId: string) {
    setError('')
    setNotice('')
    const nextEvents = events.filter((event) => event.id !== eventId)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextEvents))
      setEvents(nextEvents)
      setNotice('Event removed.')
    } catch {
      setError('The event could not be removed from this browser.')
    }
  }

  return (
    <section className="admin-calendar-page">
      <header className="admin-page-heading admin-calendar-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION / SCHEDULE</p>
          <h1>Calendar</h1>
          <p className="admin-page-subtitle">Create events and keep track of what’s coming up.</p>
        </div>
        <span className="admin-calendar-storage-note">Events are saved on this device</span>
      </header>

      <div className="admin-calendar-layout">
        <section className="admin-calendar-panel" aria-label="Calendar">
          <div className="admin-calendar-monthbar">
            <div>
              <p className="eyebrow">MONTH VIEW</p>
              <h2>{new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(visibleMonth)}</h2>
            </div>
            <div className="admin-calendar-nav">
              <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}>‹</button>
              <button type="button" onClick={() => { const now = new Date(); setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1)); selectCalendarDate(today) }}>Today</button>
              <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}>›</button>
            </div>
          </div>
          <div className="admin-calendar-grid" role="grid" aria-label="Monthly calendar">
            {weekdays.map((day) => <span className="admin-calendar-weekday" role="columnheader" key={day}>{day}</span>)}
            {calendarDays.map(({ date, key, inMonth }) => {
              const dayEvents = events.filter((event) => event.date === key)
              const selected = key === selectedDate
              return (
                <button
                  type="button"
                  role="gridcell"
                  key={key}
                  className={`admin-calendar-day${inMonth ? '' : ' outside-month'}${key === today ? ' today' : ''}${selected ? ' selected' : ''}${dayEvents.length ? ' has-events' : ''}`}
                  aria-label={`${formatEventDate(key, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length === 1 ? '' : 's'}` : ''}`}
                  aria-pressed={selected}
                  onClick={() => selectCalendarDate(key)}
                >
                  <span>{date.getDate()}</span>
                  {dayEvents.length > 0 && <i aria-hidden="true">{dayEvents.length > 3 ? '•••' : '•'.repeat(dayEvents.length)}</i>}
                </button>
              )
            })}
          </div>
          <section className="admin-selected-day" aria-live="polite">
            <div className="admin-calendar-section-title">
              <h3>{selectedDate === today ? 'Today' : formatEventDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
              <span>{selectedDayEvents.length} event{selectedDayEvents.length === 1 ? '' : 's'}</span>
            </div>
            {selectedDayEvents.length ? (
              <div className="admin-calendar-event-list">
                {selectedDayEvents.map((event) => (
                  <article className="admin-calendar-event" key={event.id}>
                    <span className={`admin-calendar-event-marker ${event.type.toLowerCase()}`} />
                    <div><strong>{event.title}</strong><small>{event.time} · {event.type}{event.description ? ` · ${event.description}` : ''}</small></div>
                    <button type="button" aria-label={`Delete ${event.title}`} title="Delete event" onClick={() => deleteEvent(event.id)}>×</button>
                  </article>
                ))}
              </div>
            ) : <p className="admin-calendar-empty">No events scheduled for this day.</p>}
          </section>
        </section>

        <aside className="admin-calendar-sidebar">
          <form className="admin-calendar-form" onSubmit={createEvent}>
            <div className="admin-calendar-form-heading">
              <p className="eyebrow">PLAN AHEAD</p>
              <h2>Create event</h2>
              <p>Add a meeting, reminder, or milestone to your calendar.</p>
            </div>
            <label>Event title
              <input value={form.title} onChange={(event) => setForm({ ...form, title: event.currentTarget.value })} maxLength={100} placeholder="e.g. Monthly inventory review" required />
            </label>
            <div className="admin-calendar-form-row">
              <label>Date
                <input type="date" value={form.date} onChange={(event) => { setForm({ ...form, date: event.currentTarget.value }); setSelectedDate(event.currentTarget.value) }} required />
              </label>
              <label>Time
                <input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.currentTarget.value })} required />
              </label>
            </div>
            <label>Event type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.currentTarget.value as EventType })}>
                {eventTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </label>
            <label>Description <span className="admin-calendar-optional">(optional)</span>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.currentTarget.value })} rows={3} maxLength={240} placeholder="Add a few details" />
            </label>
            {error && <p className="admin-calendar-message error" role="alert">{error}</p>}
            {notice && <p className="admin-calendar-message" role="status">{notice}</p>}
            <button type="submit" className="admin-calendar-submit">Create event <span aria-hidden="true">+</span></button>
          </form>

          <section className="admin-upcoming-events">
            <div className="admin-calendar-section-title">
              <div><p className="eyebrow">YOUR SCHEDULE</p><h2>Upcoming events</h2></div>
              <span>{upcomingEvents.length}</span>
            </div>
            {upcomingEvents.length ? (
              <div className="admin-upcoming-list">
                {upcomingEvents.slice(0, 8).map((event) => (
                  <button className="admin-upcoming-event" type="button" key={event.id} onClick={() => selectCalendarDate(event.date)}>
                    <span className="admin-upcoming-date"><strong>{event.date.slice(8)}</strong><small>{formatEventDate(event.date, { month: 'short' })}</small></span>
                    <span className="admin-upcoming-copy"><strong>{event.title}</strong><small>{formatEventDate(event.date, { weekday: 'short' })} · {event.time} · {event.type}</small></span>
                  </button>
                ))}
              </div>
            ) : <p className="admin-calendar-empty">No upcoming events yet. Create one to get started.</p>}
          </section>
        </aside>
      </div>
    </section>
  )
}

export default CalendarPage
