import { useState } from 'react'
import Icon from '../components/Icon'
import { MiniBars } from '../components/Charts'
import { CountUp, Delta, Modal, PageHead, Ring, Toggle } from '../components/ui'
import { useApp } from '../lib/store'
import { money, uid } from '../lib/format'
import { SAVINGS_TREND } from '../data/seed'
import { useTr } from '../lib/i18n'

const ICONS = ['laptop', 'plane', 'shield', 'car', 'gift', 'home']

function NewGoal({ onCreate }) {
  const tr = useTr()
  const [f, setF] = useState({ name: '', target: '', due: 'Dec 2026', icon: 'home' })
  const valid = f.name.trim() && Number(f.target) > 0
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onCreate(f)
      }}
    >
      <label className="field">
        <span>{tr('Goal name')}</span>
        <input value={f.name} onChange={(e) => setF((d) => ({ ...d, name: e.target.value }))} placeholder={tr('e.g. New apartment')} autoFocus />
      </label>
      <div className="field-row">
        <label className="field">
          <span>{tr('Target (USD)')}</span>
          <input inputMode="decimal" value={f.target} onChange={(e) => setF((d) => ({ ...d, target: e.target.value.replace(/[^\d.]/g, '') }))} placeholder="5,000" />
        </label>
        <label className="field">
          <span>{tr('Target date')}</span>
          <input value={f.due} onChange={(e) => setF((d) => ({ ...d, due: e.target.value }))} />
        </label>
      </div>
      <div className="field">
        <span>{tr('Icon')}</span>
        <div className="icon-pick">
          {ICONS.map((ic) => (
            <button key={ic} type="button" className={f.icon === ic ? 'on' : ''} onClick={() => setF((d) => ({ ...d, icon: ic }))} aria-label={ic}>
              <Icon name={ic} size={20} />
            </button>
          ))}
        </div>
      </div>
      <button type="submit" className="btn solid lg block" disabled={!valid}>
        <Icon name="plus" size={17} />
        {tr('Create goal')}
      </button>
    </form>
  )
}

export default function Savings() {
  const tr = useTr()
  const { goals, setGoals, autosave, setAutosave, setBalance, toast, booting } = useApp()
  const [openGoal, setOpenGoal] = useState(null)
  const [creating, setCreating] = useState(false)
  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const target = goals.reduce((s, g) => s + g.target, 0)
  const lead = booting ? 900 : 250

  const add = (g, amt) => {
    const next = Math.min(g.target, g.saved + amt)
    const moved = next - g.saved
    if (moved <= 0) return
    setGoals((list) => list.map((x) => (x.id === g.id ? { ...x, saved: next } : x)))
    setBalance((b) => b - moved)
    if (next >= g.target) toast(tr('Goal reached!'), tr(`${g.name} is fully funded.`), { icon: 'trophy' })
    else toast(tr(`${money(moved, '$', 0)} added`), tr(`${g.name} · ${Math.round((next / g.target) * 100)}% there`), { icon: 'plus' })
  }

  return (
    <>
      <PageHead title={tr('Savings & Goals')} sub={tr('Set money aside for the things that matter — and watch it grow.')}>
        <button type="button" className="btn solid lg" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          {tr('New goal')}
        </button>
      </PageHead>

      <div className="savings-top">
        <section className="card saved-card" style={{ '--d': '0ms' }}>
          <div className="saved-left">
            <span className="card-label rv" style={{ '--i': 0 }}>
              {tr('Total saved')}
            </span>
            <strong className="saved-val rv" style={{ '--i': 1 }}>
              <CountUp value={saved} format={(n) => money(n)} delay={lead} duration={1600} />
            </strong>
            <div className="bal-delta rv" style={{ '--i': 2 }}>
              <Delta value={12} />
              <span>{tr('more than last quarter')}</span>
            </div>
            <div className="saved-progress rv" style={{ '--i': 3 }}>
              <div className="limit-bar">
                <span className="limit-fill" style={{ width: `${(saved / target) * 100}%` }} />
              </div>
              <small>
                {tr('{pct}% of {total} across {count} goals', { pct: Math.round((saved / target) * 100), total: money(target, '$', 0), count: goals.length })}
              </small>
            </div>
          </div>
          <div className="saved-right rv" style={{ '--i': 2 }}>
            <span className="muted">{tr('Monthly contributions')}</span>
            <MiniBars data={SAVINGS_TREND} format={(v) => money(v, '$', 0)} />
          </div>
        </section>

        <section className="card autosave-card" style={{ '--d': '90ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Auto-save')}</h2>
            <span className="pill-tag green">{tr('{count} on', { count: autosave.filter((a) => a.on).length })}</span>
          </div>
          <div className="control-list">
            {autosave.map((a, i) => (
              <div key={a.id} className="control rv" style={{ '--i': i + 1 }}>
                <span className="control-ic">
                  <Icon name={a.id === 'round' ? 'refresh' : a.id === 'payday' ? 'bolt' : 'calendar'} size={18} />
                </span>
                <span className="control-txt">
                  <strong>{tr(a.label)}</strong>
                  <small>{tr(a.body)}</small>
                </span>
                <Toggle on={a.on} label={tr(a.label)} onChange={(v) => setAutosave((list) => list.map((x) => (x.id === a.id ? { ...x, on: v } : x)))} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="goal-grid">
        {goals.map((g, i) => {
          const p = g.saved / g.target
          const done = p >= 1
          return (
            <article key={g.id} className={`card goal ${done ? 'done' : ''}`} style={{ '--d': `${160 + i * 70}ms` }}>
              <div className="goal-top rv" style={{ '--i': 0 }}>
                <span className="goal-ic" style={{ background: `hsl(${g.hue} 80% 94%)`, color: `hsl(${g.hue} 60% 42%)` }}>
                  <Icon name={g.icon} size={20} />
                </span>
                {done ? (
                  <span className="pill-tag green goal-badge">
                    <Icon name="trophy" size={13} />
                    {tr('Reached')}
                  </span>
                ) : (
                  <span className="pill-tag">{tr(g.due)}</span>
                )}
              </div>
              <div className="goal-ring rv" style={{ '--i': 1 }}>
                <Ring value={p} size={120} stroke={10} color={done ? 'var(--green)' : 'var(--accent)'}>
                  <strong>{Math.round(p * 100)}%</strong>
                  <small>{tr('saved')}</small>
                </Ring>
              </div>
              <strong className="goal-name rv" style={{ '--i': 2 }}>
                {tr(g.name)}
              </strong>
              <p className="goal-amt rv" style={{ '--i': 3 }}>
                <b>{money(g.saved, '$', 0)}</b> {tr('of')} {money(g.target, '$', 0)}
              </p>
              <div className={`goal-add ${openGoal === g.id ? 'open' : ''}`}>
                {openGoal === g.id ? (
                  <div className="goal-chips">
                    {[50, 100, 500].map((v) => (
                      <button key={v} type="button" className="chip" onClick={() => add(g, v)}>
                        +${v}
                      </button>
                    ))}
                    <button type="button" className="chip" onClick={() => setOpenGoal(null)} aria-label={tr('Close')}>
                      <Icon name="close" size={13} />
                    </button>
                  </div>
                ) : (
                  <button type="button" className="btn block" disabled={done} onClick={() => setOpenGoal(g.id)}>
                    <Icon name={done ? 'check' : 'plus'} size={16} />
                    {done ? tr('Fully funded') : tr('Add money')}
                  </button>
                )}
              </div>
            </article>
          )
        })}
        <button type="button" className="card goal new-goal" style={{ '--d': `${160 + goals.length * 70}ms` }} onClick={() => setCreating(true)}>
          <span>
            <Icon name="plus" size={26} />
          </span>
          <strong>{tr('New goal')}</strong>
          <small>{tr('Start saving for something new')}</small>
        </button>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title={tr('New savings goal')} sub={tr('We’ll suggest a weekly amount to get you there.')}>
        {creating ? (
          <NewGoal
            onCreate={(f) => {
              setGoals((list) => [...list, { id: uid(), name: f.name.trim(), icon: f.icon, saved: 0, target: Number(f.target), due: f.due, hue: Math.floor(Math.random() * 360) }])
              setCreating(false)
              toast(tr('Goal created'), f.name.trim(), { icon: 'sparkle' })
            }}
          />
        ) : null}
      </Modal>
    </>
  )
}
