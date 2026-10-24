import { useState } from 'react'
import Icon from '../components/Icon'
import { Avatar } from '../components/Brand'
import { PageHead, Toggle } from '../components/ui'
import { useApp } from '../lib/store'
import { money, uid } from '../lib/format'
import { useTr } from '../lib/i18n'

const LIMITS = [
  { label: 'Daily transfers', used: 12400, cap: 25000 },
  { label: 'ATM withdrawals', used: 300, cap: 1000 },
  { label: 'Online payments', used: 4250, cap: 10000 },
]

function ProfileForm({ user, onSave, onCancel }) {
  const tr = useTr()
  const [draft, setDraft] = useState(user)
  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }))
  return (
    <form
      className="form profile-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSave(draft)
      }}
    >
      <div className="field-row">
        <label className="field">
          <span>{tr('Full name')}</span>
          <input value={draft.name} onChange={set('name')} required />
        </label>
        <label className="field">
          <span>{tr('Email')}</span>
          <input type="email" value={draft.email} onChange={set('email')} required />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>{tr('Phone')}</span>
          <input value={draft.phone} onChange={set('phone')} />
        </label>
        <label className="field">
          <span>{tr('Location')}</span>
          <input value={draft.location} onChange={set('location')} />
        </label>
      </div>
      <div className="row-btns end">
        <button type="button" className="btn lg" onClick={onCancel}>
          {tr('Cancel')}
        </button>
        <button type="submit" className="btn solid lg">
          {tr('Save changes')}
        </button>
      </div>
    </form>
  )
}

export default function Account() {
  const tr = useTr()
  const { user, setUser, banks, setBanks, sessions, setSessions, security, setSecurity, toast } = useApp()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <PageHead title={tr('Account')} sub={tr('Your personal details, linked banks and security — all in one place.')} />

      <div className="account-grid">
        <section className="card profile-card" style={{ '--d': '0ms' }}>
          <div className="profile-top rv" style={{ '--i': 0 }}>
            <div className="profile-avatar">
              <Avatar size={84} />
              <span className="verified" title={tr('Identity verified')}>
                <Icon name="check" size={12} stroke={3} />
              </span>
            </div>
            <div className="profile-id">
              <h2>{tr(user.name)}</h2>
              <p>{user.email}</p>
              <div className="chips-row">
                <span className="pill-tag green">
                  <Icon name="shield" size={13} />
                  {tr('Verified')}
                </span>
                <span className="pill-tag accent">
                  <Icon name="crown" size={13} />
                  {tr('Gold member')}
                </span>
                <span className="pill-tag">{tr('Since {date}', { date: tr(user.memberSince) })}</span>
              </div>
            </div>
            {!editing ? (
              <button type="button" className="btn ghost lg" onClick={() => setEditing(true)}>
                <Icon name="edit" size={17} />
                {tr('Edit profile')}
              </button>
            ) : null}
          </div>

          {editing ? (
            <ProfileForm
              user={user}
              onCancel={() => setEditing(false)}
              onSave={(d) => {
                setUser({ ...d, first: d.name.trim().split(/\s+/)[0] })
                setEditing(false)
                toast(tr('Profile updated'), tr('Your changes are saved.'), { icon: 'user' })
              }}
            />
          ) : (
            <dl className="profile-facts">
              {[
                { icon: 'user', k: 'Full name', v: user.name },
                { icon: 'mail', k: 'Email', v: user.email },
                { icon: 'phone', k: 'Phone', v: user.phone },
                { icon: 'pin', k: 'Location', v: user.location },
              ].map((f, i) => (
                <div key={f.k} className="rv" style={{ '--i': i + 1 }}>
                  <span className="control-ic">
                    <Icon name={f.icon} size={18} />
                  </span>
                  <dt>{tr(f.k)}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section className="card banks-card" style={{ '--d': '90ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Linked banks')}</h2>
            <button
              type="button"
              className="add-new"
              onClick={() => {
                const n = String(Math.floor(1000 + Math.random() * 9000))
                setBanks((b) => [...b, { id: uid(), name: 'Atlas Bank', mask: `•••• ${n}`, type: 'Checking', primary: false, hue: 262 }])
                toast(tr('Bank linked'), tr(`Atlas Bank •••• ${n} is ready for transfers.`), { icon: 'bank' })
              }}
            >
              <Icon name="plus" size={16} stroke={2} />
              {tr('Link bank')}
            </button>
          </div>
          <div className="bank-list">
            {banks.map((b, i) => (
              <div key={b.id} className="bank-row rv" style={{ '--i': i + 1 }}>
                <span className="bank-logo" style={{ background: `hsl(${b.hue} 70% 94%)`, color: `hsl(${b.hue} 65% 42%)` }}>
                  <Icon name="bank" size={20} />
                </span>
                <span className="control-txt">
                  <strong>{tr(b.name)}</strong>
                  <small>
                    {tr(b.type)} · {b.mask}
                  </small>
                </span>
                {b.primary ? (
                  <span className="pill-tag accent">{tr('Primary')}</span>
                ) : (
                  <div className="bank-acts">
                    <button
                      type="button"
                      className="btn tiny"
                      onClick={() => {
                        setBanks((list) => list.map((x) => ({ ...x, primary: x.id === b.id })))
                        toast(tr('Primary bank changed'), `${b.name} ${b.mask}`, { icon: 'bank' })
                      }}
                    >
                      {tr('Make primary')}
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={tr(`Remove ${b.name}`)}
                      onClick={() => {
                        setBanks((list) => list.filter((x) => x.id !== b.id))
                        toast(tr('Bank removed'), `${b.name} ${b.mask}`, { icon: 'trash' })
                      }}
                    >
                      <Icon name="trash" size={17} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card security-card" style={{ '--d': '170ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Security')}</h2>
            <span className={`pill-tag ${security.twoFactor ? 'green' : 'amber'}`}>{security.twoFactor ? tr('Strong') : tr('Needs attention')}</span>
          </div>
          <div className="control-list">
            {[
              { key: 'twoFactor', icon: 'key', label: 'Two-factor authentication', body: 'A code from your phone on every new sign-in' },
              { key: 'biometric', icon: 'eye', label: 'Face ID & Touch ID', body: 'Approve payments with biometrics' },
              { key: 'alerts', icon: 'bell', label: 'Sign-in alerts', body: 'Email me when a new device signs in' },
            ].map((c, i) => (
              <div key={c.key} className="control rv" style={{ '--i': i + 1 }}>
                <span className="control-ic">
                  <Icon name={c.icon} size={19} />
                </span>
                <span className="control-txt">
                  <strong>{tr(c.label)}</strong>
                  <small>{tr(c.body)}</small>
                </span>
                <Toggle on={security[c.key]} label={tr(c.label)} onChange={(v) => setSecurity((s) => ({ ...s, [c.key]: v }))} />
              </div>
            ))}
          </div>
          <h3 className="sub-title rv" style={{ '--i': 4 }}>
            {tr('Active sessions')}
          </h3>
          <div className="session-list">
            {sessions.map((s, i) => (
              <div key={s.id} className="session rv" style={{ '--i': i + 5 }}>
                <span className="control-ic">
                  <Icon name={s.icon} size={18} />
                </span>
                <span className="control-txt">
                  <strong>{tr(s.device)}</strong>
                  <small>
                    {tr(s.place)} · {tr(s.when)}
                  </small>
                </span>
                {s.current ? (
                  <span className="pill-tag green">{tr('This device')}</span>
                ) : (
                  <button
                    type="button"
                    className="btn tiny danger"
                    onClick={() => {
                      setSessions((list) => list.filter((x) => x.id !== s.id))
                      toast(tr('Session revoked'), tr(s.device), { icon: 'logout' })
                    }}
                  >
                    {tr('Revoke')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card limits-card" style={{ '--d': '240ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Account limits')}</h2>
            <span className="muted">{tr('Resets daily at midnight')}</span>
          </div>
          <div className="limit-rows">
            {LIMITS.map((l, i) => {
              const p = (l.used / l.cap) * 100
              return (
                <div key={l.label} className="limit-row rv" style={{ '--i': i + 1 }}>
                  <div className="lr-head">
                    <span>{tr(l.label)}</span>
                    <span>
                      <b>{money(l.used, '$', 0)}</b> / {money(l.cap, '$', 0)}
                    </span>
                  </div>
                  <div className="limit-bar">
                    <span className="limit-fill" style={{ width: `${p}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </>
  )
}
