import { useMemo, useState } from 'react'
import Icon from '../components/Icon'
import { Empty, PageHead } from '../components/ui'
import { useApp } from '../lib/store'
import { DAYS, MONTHS, isoDay, money, uid } from '../lib/format'

/* The demo data lives in April 2026, so that is the calendar's "today". */
const TODAY = '2026-04-17'
const KINDS = {
  bill: { label: 'Bill', icon: 'receipt' },
  income: { label: 'Income', icon: 'arrowDown' },
  transfer: { label: 'Transfer', icon: 'transfer' },
  subscription: { label: 'Subscription', icon: 'refresh' },
  reminder: { label: 'Reminder', icon: 'bell' },
  travel: { label: 'Travel', icon: 'plane' },
}
const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const monthCells = (y, m) => {
  const first = new Date(y, m, 1)
  const offset = (first.getDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => new Date(y, m, i - offset + 1))
}

function ReminderForm({ day, onAdd }) {
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('09:00')
  const [amount, setAmount] = useState('')
  const [kind, setKind] = useState('reminder')
  return (
    <form
      className="reminder-form"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        const n = Number(amount)
        onAdd({ id: uid(), date: day, time, title: title.trim(), amount: amount ? (kind === 'income' ? n : -n) : null, kind })
        setTitle('')
        setAmount('')
      }}
    >
      <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add a reminder or bill…" aria-label="Reminder title" />
      <div className="rf-row">
        <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time" />
        <input className="input" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="$ amount" aria-label="Amount" />
      </div>
      <div className="rf-kinds">
        {Object.entries(KINDS).map(([key, v]) => (
          <button key={key} type="button" className={`kind-chip ${key} ${kind === key ? 'on' : ''}`} onClick={() => setKind(key)}>
            {v.label}
          </button>
        ))}
      </div>
      <button type="submit" className="btn solid block lg" disabled={!title.trim()}>
        <Icon name="plus" size={17} />
        Add to {new Date(day).getDate()} {MONTHS[new Date(day).getMonth()]}
      </button>
    </form>
  )
}

export default function Schedule() {
  const { events, setEvents, toast } = useApp()
  const [cursor, setCursor] = useState({ y: 2026, m: 3 })
  const [dir, setDir] = useState(0)
  const [sel, setSel] = useState(TODAY)

  const byDay = useMemo(() => {
    const map = {}
    for (const e of [...events].sort((a, b) => a.time.localeCompare(b.time))) (map[e.date] ??= []).push(e)
    return map
  }, [events])

  const shift = (n) => {
    setDir(n)
    setCursor(({ y, m }) => {
      const d = new Date(y, m + n, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const cells = monthCells(cursor.y, cursor.m)
  const selDate = new Date(`${sel}T00:00`)
  const dayEvents = byDay[sel] ?? []
  const upcoming = events.filter((e) => e.date > sel).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).slice(0, 5)
  const monthTotal = events
    .filter((e) => e.date.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`) && e.amount)
    .reduce((s, e) => s + e.amount, 0)

  return (
    <>
      <PageHead title="Schedule" sub="Bills, transfers and reminders laid out on one calendar." />

      <div className="schedule-grid">
        <section className="card calendar-card" style={{ '--d': '0ms' }}>
          <div className="cal-head rv" style={{ '--i': 0 }}>
            <div>
              <h2 className="card-title big">
                {MONTHS[cursor.m]} {cursor.y}
              </h2>
              <p className="card-sub">
                Net scheduled: <b className={monthTotal >= 0 ? 'pos' : 'neg'}>{money(monthTotal)}</b>
              </p>
            </div>
            <div className="cal-nav">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setDir(0)
                  setCursor({ y: 2026, m: 3 })
                  setSel(TODAY)
                }}
              >
                Today
              </button>
              <button type="button" className="icon-btn soft" onClick={() => shift(-1)} aria-label="Previous month">
                <Icon name="chevLeft" size={18} />
              </button>
              <button type="button" className="icon-btn soft" onClick={() => shift(1)} aria-label="Next month">
                <Icon name="chevRight" size={18} />
              </button>
            </div>
          </div>

          <div className="cal-week rv" style={{ '--i': 1 }}>
            {WEEK.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={`cal-grid ${dir > 0 ? 'from-right' : dir < 0 ? 'from-left' : ''}`} key={`${cursor.y}-${cursor.m}`}>
            {cells.map((d, i) => {
              const id = isoDay(d)
              const evs = byDay[id] ?? []
              const out = d.getMonth() !== cursor.m
              return (
                <button
                  key={id}
                  type="button"
                  className={`cal-cell ${out ? 'out' : ''} ${id === TODAY ? 'today' : ''} ${id === sel ? 'sel' : ''}`}
                  style={{ '--c': i }}
                  onClick={() => setSel(id)}
                >
                  <span className="cal-num">{d.getDate()}</span>
                  <span className="cal-evs">
                    {evs.slice(0, 2).map((e) => (
                      <i key={e.id} className={`cal-ev ${e.kind}`}>
                        {e.title}
                      </i>
                    ))}
                    {evs.length > 2 ? <em>+{evs.length - 2} more</em> : null}
                  </span>
                  <span className="cal-dots">
                    {evs.slice(0, 3).map((e) => (
                      <i key={e.id} className={e.kind} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <div className="schedule-side">
          <section className="card day-card" style={{ '--d': '90ms' }}>
            <div className="section-head rv" style={{ '--i': 0 }}>
              <div>
                <h2 className="card-title big">
                  {DAYS[selDate.getDay()]}, {selDate.getDate()} {MONTHS[selDate.getMonth()]}
                </h2>
                <p className="card-sub">
                  {dayEvents.length ? `${dayEvents.length} item${dayEvents.length > 1 ? 's' : ''} scheduled` : 'Nothing scheduled yet'}
                </p>
              </div>
              {sel === TODAY ? <span className="pill-tag accent">Today</span> : null}
            </div>
            <div className="day-list" key={sel}>
              {dayEvents.length === 0 ? <Empty icon="calendar" title="A free day" body="Add a bill or reminder below." /> : null}
              {dayEvents.map((e, i) => (
                <div key={e.id} className={`day-ev ${e.kind}`} style={{ '--i': i }}>
                  <span className="day-ic">
                    <Icon name={KINDS[e.kind].icon} size={17} />
                  </span>
                  <span className="control-txt">
                    <strong>{e.title}</strong>
                    <small>
                      {e.time} · {KINDS[e.kind].label}
                    </small>
                  </span>
                  {e.amount != null ? <b className={e.amount > 0 ? 'pos' : ''}>{money(e.amount)}</b> : null}
                  <button
                    type="button"
                    className="day-x"
                    aria-label={`Remove ${e.title}`}
                    onClick={() => {
                      setEvents((list) => list.filter((x) => x.id !== e.id))
                      toast('Removed from schedule', e.title, { icon: 'trash' })
                    }}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </div>
              ))}
            </div>
            <ReminderForm
              day={sel}
              onAdd={(e) => {
                setEvents((list) => [...list, e])
                toast('Added to schedule', `${e.title} · ${e.time}`, { icon: 'calendar' })
              }}
            />
          </section>

          <section className="card upcoming-card" style={{ '--d': '170ms' }}>
            <div className="section-head rv" style={{ '--i': 0 }}>
              <h2 className="card-title">Coming up next</h2>
            </div>
            <ul className="upcoming">
              {upcoming.map((e, i) => {
                const d = new Date(`${e.date}T00:00`)
                return (
                  <li key={e.id} className="rv" style={{ '--i': i + 1 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSel(e.date)
                        setDir(0)
                        setCursor({ y: d.getFullYear(), m: d.getMonth() })
                      }}
                    >
                      <span className="up-date">
                        <b>{d.getDate()}</b>
                        <small>{MONTHS[d.getMonth()]}</small>
                      </span>
                      <span className="control-txt">
                        <strong>{e.title}</strong>
                        <small>
                          {DAYS[d.getDay()]} · {e.time}
                        </small>
                      </span>
                      {e.amount != null ? <b className={e.amount > 0 ? 'pos' : ''}>{money(e.amount, '$', 0)}</b> : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
