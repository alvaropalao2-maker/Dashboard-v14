import { useState } from 'react'
import Icon from '../components/Icon'
import { Empty, PageHead } from '../components/ui'
import { useApp } from '../lib/store'
import { FAQS, HELP_TOPICS } from '../data/seed'
import { useTr } from '../lib/i18n'

const STATUS = ['Payments', 'Cards', 'Transfers', 'Mobile app']

export default function Help() {
  const tr = useTr()
  const { go, toast } = useApp()
  const [q, setQ] = useState('')
  const [topic, setTopic] = useState(null)
  const [open, setOpen] = useState('f1')

  const term = q.trim().toLowerCase()
  const faqs = FAQS.filter((f) => (!topic || f.topic === topic) && (!term || `${tr(f.q)} ${tr(f.a)}`.toLowerCase().includes(term)))

  return (
    <>
      <PageHead title={tr('Help Center')} sub={tr('Answers, guides and real humans when you need them.')} />

      <section className="card help-hero" style={{ '--d': '0ms' }}>
        <div className="hh-glow" aria-hidden="true" />
        <h2 className="rv" style={{ '--i': 0 }}>
          {tr('How can we help, today?')}
        </h2>
        <label className="hh-search rv" style={{ '--i': 1 }}>
          <Icon name="search" size={20} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Search for answers — e.g. “freeze card”')} aria-label={tr('Search help')} />
          {q ? (
            <button type="button" onClick={() => setQ('')} aria-label={tr('Clear')}>
              <Icon name="close" size={15} />
            </button>
          ) : null}
        </label>
        <div className="hh-popular rv" style={{ '--i': 2 }}>
          <span>{tr('Popular:')}</span>
          {['pending', 'freeze', 'limit', '2FA'].map((p) => (
            <button key={p} type="button" onClick={() => setQ(tr(p === '2FA' ? 'two-factor' : p))}>
              {tr(p)}
            </button>
          ))}
        </div>
      </section>

      <div className="topic-grid">
        {HELP_TOPICS.map((t, i) => (
          <button key={t.id} type="button" className={`card topic ${topic === t.id ? 'on' : ''}`} style={{ '--d': `${90 + i * 60}ms` }} onClick={() => setTopic((x) => (x === t.id ? null : t.id))}>
            <span className="topic-ic">
              <Icon name={t.icon} size={22} />
            </span>
            <strong>{tr(t.id)}</strong>
            <small>{tr(t.body)}</small>
            <em>{tr('{count} articles', { count: FAQS.filter((f) => f.topic === t.id).length })}</em>
          </button>
        ))}
      </div>

      <div className="help-grid">
        <section className="card faq-card" style={{ '--d': '320ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{topic ? tr(`${topic} questions`) : tr('Frequently asked')}</h2>
            {topic || term ? (
              <button
                type="button"
                className="link"
                onClick={() => {
                  setTopic(null)
                  setQ('')
                }}
              >
                {tr('Clear filters')}
              </button>
            ) : null}
          </div>
          <div className="faqs">
            {faqs.length === 0 ? <Empty icon="help" title={tr('No answers match')} body={tr('Try other words, or chat with us.')} /> : null}
            {faqs.map((f, i) => (
              <div key={f.id} className={`faq rv ${open === f.id ? 'open' : ''}`} style={{ '--i': i + 1 }}>
                <button type="button" className="faq-q" onClick={() => setOpen((o) => (o === f.id ? null : f.id))} aria-expanded={open === f.id}>
                  <span>{tr(f.q)}</span>
                  <i>
                    <Icon name="plus" size={16} stroke={2} />
                  </i>
                </button>
                <div className="faq-a">
                  <div>
                    <p>{tr(f.a)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="help-side">
          <section className="card contact-card" style={{ '--d': '380ms' }}>
            <h2 className="card-title big rv" style={{ '--i': 0 }}>
              {tr('Still stuck?')}
            </h2>
            <p className="card-sub rv" style={{ '--i': 1 }}>
              {tr('Our team replies in under 3 minutes on average.')}
            </p>
            <button type="button" className="support-opt primary rv" style={{ '--i': 2 }} onClick={() => go('messages', { chat: 'support' })}>
              <span>
                <Icon name="chat" size={20} />
              </span>
              <span className="control-txt">
                <strong>{tr('Chat with support')}</strong>
                <small>{tr('Online now · avg. 3 min reply')}</small>
              </span>
              <Icon name="arrowRight" size={18} />
            </button>
            <button
              type="button"
              className="support-opt rv"
              style={{ '--i': 3 }}
              onClick={() => {
                navigator.clipboard?.writeText('contacto@polplab.com').catch(() => {})
                toast(tr('Email copied'), tr('contacto@polplab.com'), { icon: 'mail' })
              }}
            >
              <span>
                <Icon name="mail" size={20} />
              </span>
              <span className="control-txt">
                <strong>{tr('Email us')}</strong>
                <small>{tr('contacto@polplab.com')}</small>
              </span>
              <Icon name="copy" size={17} />
            </button>
            <button type="button" className="support-opt rv" style={{ '--i': 4 }} onClick={() => toast(tr('Calling support…'), '+51 965 485 460 · 24/7', { icon: 'phone' })}>
              <span>
                <Icon name="phone" size={20} />
              </span>
              <span className="control-txt">
                <strong>{tr('Call us')}</strong>
                <small>24/7 · +51 965 485 460</small>
              </span>
              <Icon name="arrowRight" size={18} />
            </button>
          </section>

          <section className="card status-card" style={{ '--d': '440ms' }}>
            <div className="section-head rv" style={{ '--i': 0 }}>
              <h2 className="card-title">{tr('System status')}</h2>
              <span className="live-dot">{tr('All good')}</span>
            </div>
            <ul className="status-list">
              {STATUS.map((s, i) => (
                <li key={s} className="rv" style={{ '--i': i + 1 }}>
                  <span>{tr(s)}</span>
                  <span className="uptime">
                    {Array.from({ length: 24 }, (_, j) => (
                      <i key={j} className={j === 17 && i === 2 ? 'warn' : ''} style={{ '--j': j }} />
                    ))}
                  </span>
                  <b>{i === 2 ? '99.96%' : '100%'}</b>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </>
  )
}
