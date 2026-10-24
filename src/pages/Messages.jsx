import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { Persona } from '../components/Brand'
import { PageHead, Segmented } from '../components/ui'
import { useApp } from '../lib/store'
import { clock } from '../lib/format'
import { AUTO_REPLIES } from '../data/seed'
import { useTr } from '../lib/i18n'

export default function Messages() {
  const tr = useTr()
  const { conversations, setConversations, params } = useApp()
  const [activeId, setActiveId] = useState(params.chat ?? conversations[0].id)
  const [filter, setFilter] = useState('All')
  const [q, setQ] = useState('')
  const [draft, setDraft] = useState('')
  const [typing, setTyping] = useState(null)
  const thread = useRef(null)
  const timers = useRef([])

  const active = conversations.find((c) => c.id === activeId) ?? conversations[0]

  useEffect(() => {
    const list = timers.current
    return () => list.forEach((t) => window.clearTimeout(t))
  }, [])

  useEffect(() => {
    const el = thread.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [active.messages.length, typing, activeId])

  const open = (id) => {
    setActiveId(id)
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, unread: 0 } : c)))
  }

  const send = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    const id = active.id
    const now = clock(new Date())
    setConversations((list) => list.map((c) => (c.id === id ? { ...c, messages: [...c.messages, { from: 'me', text, time: now }] } : c)))
    setDraft('')
    timers.current.push(
      window.setTimeout(() => setTyping(id), 500),
      window.setTimeout(() => {
        setTyping(null)
        const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)]
        setConversations((list) =>
          list.map((c) => (c.id === id ? { ...c, messages: [...c.messages, { from: 'them', text: reply, time: clock(new Date()) }] } : c)),
        )
      }, 2100),
    )
  }

  const list = conversations
    .filter((c) => filter === 'All' || c.unread > 0)
    .filter((c) => !q.trim() || c.name.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <>
      <PageHead title={tr('Messages')} sub={tr('Talk to your bank, your team and the people you pay.')} />

      <section className="card messenger" style={{ '--d': '0ms' }}>
        <aside className="convo-pane">
          <div className="convo-tools rv" style={{ '--i': 0 }}>
            <label className="search-box">
              <Icon name="search" size={18} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tr('Search chats')} aria-label={tr('Search chats')} />
            </label>
            <Segmented items={['All', 'Unread']} value={filter} onChange={setFilter} size="sm" />
          </div>
          <div className="convo-list">
            {list.map((c, i) => {
              const last = c.messages[c.messages.length - 1]
              return (
                <button key={c.id} type="button" className={`convo rv ${c.id === active.id ? 'on' : ''}`} style={{ '--i': i + 1 }} onClick={() => open(c.id)}>
                  <span className="convo-av">
                    <Persona name={c.name} hue={c.hue} brand={c.brand} size={44} />
                    {c.online ? <i className="online" /> : null}
                  </span>
                  <span className="convo-txt">
                    <strong>{tr(c.name)}</strong>
                    <small>
                      {typing === c.id ? <em className="typing-txt">{tr('typing…')}</em> : `${last.from === 'me' ? `${tr('You')}: ` : ''}${tr(last.text)}`}
                    </small>
                  </span>
                  <span className="convo-meta">
                    <small>{tr(last.time)}</small>
                    {c.unread && c.id !== active.id ? <b>{c.unread}</b> : null}
                  </span>
                </button>
              )
            })}
            {list.length === 0 ? <p className="convo-empty">{tr('No chats here.')}</p> : null}
          </div>
        </aside>

        <div className="thread-pane" key={active.id}>
          <header className="thread-head">
            <Persona name={active.name} hue={active.hue} brand={active.brand} size={42} />
            <div>
              <strong>{tr(active.name)}</strong>
              <small className={active.online ? 'on' : ''}>{typing === active.id ? tr('typing…') : active.online ? tr('Online') : tr('Last seen recently')}</small>
            </div>
            <button type="button" className="icon-btn soft" aria-label={tr('Call')}>
              <Icon name="phone" size={18} />
            </button>
            <button type="button" className="icon-btn soft" aria-label={tr('More')}>
              <Icon name="dotsV" size={18} stroke={2.6} />
            </button>
          </header>

          <div className="thread" ref={thread}>
            <span className="day-divider">{tr('Today')}</span>
            {active.messages.map((m, i) => (
              <div key={`${i}-${m.time}`} className={`bubble ${m.from}`} style={{ '--i': i }}>
                <p>{tr(m.text)}</p>
                <small>{tr(m.time)}</small>
              </div>
            ))}
            {typing === active.id ? (
              <div className="bubble them typing">
                <i />
                <i />
                <i />
              </div>
            ) : null}
          </div>

          <form className="composer" onSubmit={send}>
            <button type="button" className="icon-btn" aria-label={tr('Attach file')}>
              <Icon name="paperclip" size={19} />
            </button>
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={tr(`Message ${active.name}…`)} aria-label={tr('Message')} />
            <button type="button" className="icon-btn" aria-label={tr('Emoji')} onClick={() => setDraft((d) => `${d}🙂`)}>
              <Icon name="smile" size={19} />
            </button>
            <button type="submit" className="send-btn" disabled={!draft.trim()} aria-label={tr('Send')}>
              <Icon name="send" size={18} />
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
