import { useState } from 'react'
import Icon from '../components/Icon'
import { Persona } from '../components/Brand'
import { Empty, Modal, PageHead, Segmented } from '../components/ui'
import { useApp } from '../lib/store'
import { money, uid } from '../lib/format'

function AddContact({ onAdd }) {
  const [f, setF] = useState({ name: '', handle: '', bank: '', kind: 'person' })
  const set = (k) => (e) => setF((d) => ({ ...d, [k]: e.target.value }))
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (f.name.trim()) onAdd(f)
      }}
    >
      <label className="field">
        <span>Name</span>
        <input value={f.name} onChange={set('name')} placeholder="Full name or business" autoFocus />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Handle or website</span>
          <input value={f.handle} onChange={set('handle')} placeholder="@handle" />
        </label>
        <label className="field">
          <span>Bank account</span>
          <input value={f.bank} onChange={set('bank')} placeholder="Bank •• 1234" />
        </label>
      </div>
      <div className="field">
        <span>Type</span>
        <Segmented
          items={[
            { key: 'person', label: 'Person' },
            { key: 'business', label: 'Business' },
          ]}
          value={f.kind}
          onChange={(kind) => setF((d) => ({ ...d, kind }))}
        />
      </div>
      <button type="submit" className="btn solid lg block" disabled={!f.name.trim()}>
        <Icon name="plus" size={17} />
        Save contact
      </button>
    </form>
  )
}

export default function Contacts() {
  const { contacts, setContacts, conversations, sendMoney, balance, openModal, go, toast } = useApp()
  const [filter, setFilter] = useState('all')
  const [q, setQ] = useState('')
  const [pickId, setPickId] = useState(contacts.find((c) => c.fav)?.id)
  const [amount, setAmount] = useState('100')
  const [sentTo, setSentTo] = useState(null)
  const [adding, setAdding] = useState(false)

  const favs = contacts.filter((c) => c.fav)
  const pick = contacts.find((c) => c.id === pickId)
  const value = Number(amount)

  const shown = contacts
    .filter((c) => filter === 'all' || (filter === 'fav' ? c.fav : c.kind === 'business'))
    .filter((c) => !q.trim() || `${c.name} ${c.handle}`.toLowerCase().includes(q.trim().toLowerCase()))

  return (
    <>
      <PageHead title="Contacts" sub="The people and businesses you pay the most, one tap away.">
        <button type="button" className="btn solid lg" onClick={() => setAdding(true)}>
          <Icon name="plus" size={18} />
          Add contact
        </button>
      </PageHead>

      <section className="card quick-card" style={{ '--d': '0ms' }}>
        <div className="quick-left">
          <div className="section-head rv" style={{ '--i': 0 }}>
            <div>
              <h2 className="card-title big">Quick transfer</h2>
              <p className="card-sub">Pick a favourite, choose an amount, done.</p>
            </div>
          </div>
          <div className="fav-row">
            {favs.map((c, i) => (
              <button key={c.id} type="button" className={`fav rv ${c.id === pickId ? 'on' : ''}`} style={{ '--i': i + 1 }} onClick={() => setPickId(c.id)}>
                <Persona name={c.name} hue={c.hue} size={56} />
                <span>{c.name.split(' ')[0]}</span>
              </button>
            ))}
            <button type="button" className="fav add rv" style={{ '--i': favs.length + 1 }} onClick={() => setAdding(true)}>
              <span className="fav-add">
                <Icon name="plus" size={22} />
              </span>
              <span>New</span>
            </button>
          </div>
        </div>
        <form
          className="quick-right rv"
          style={{ '--i': 3 }}
          onSubmit={(e) => {
            e.preventDefault()
            if (!pick || !(value > 0) || value > balance) return
            sendMoney({ to: pick.name, amount: value })
            setContacts((list) => list.map((c) => (c.id === pick.id ? { ...c, last: value, lastDate: 'Today' } : c)))
            setSentTo(`${pick.id}-${Date.now()}`)
          }}
        >
          <div className="qt-to">
            {pick ? <Persona name={pick.name} hue={pick.hue} size={38} /> : null}
            <span className="control-txt">
              <small>Sending to</small>
              <strong>{pick ? pick.name : 'Pick someone'}</strong>
            </span>
          </div>
          <div className="amount-input">
            <b>$</b>
            <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} aria-label="Amount" />
            <em>USD</em>
          </div>
          <div className="chips">
            {[50, 100, 250, 500].map((v) => (
              <button key={v} type="button" className={`chip ${value === v ? 'on' : ''}`} onClick={() => setAmount(String(v))}>
                ${v}
              </button>
            ))}
          </div>
          <button type="submit" className="btn solid lg block send-now" disabled={!pick || !(value > 0) || value > balance}>
            <span key={sentTo ?? 'idle'} className={sentTo ? 'sent-flash' : ''}>
              <Icon name={sentTo ? 'check' : 'send'} size={18} />
            </span>
            Send {value > 0 ? money(value) : ''}
          </button>
        </form>
      </section>

      <div className="contacts-toolbar rv" style={{ '--d': '120ms', '--i': 0 }}>
        <Segmented
          items={[
            { key: 'all', label: 'All', count: contacts.length },
            { key: 'fav', label: 'Favourites', count: favs.length },
            { key: 'business', label: 'Businesses', count: contacts.filter((c) => c.kind === 'business').length },
          ]}
          value={filter}
          onChange={setFilter}
        />
        <label className="search-box">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contacts" aria-label="Search contacts" />
        </label>
      </div>

      <div className="contact-grid" key={filter}>
        {shown.length === 0 ? <Empty icon="users" title="No contacts found" body="Try another name or filter." /> : null}
        {shown.map((c, i) => {
          const chat = conversations.find((x) => x.id === c.id)
          return (
            <article key={c.id} className="card contact" style={{ '--d': `${160 + i * 45}ms` }}>
              <button
                type="button"
                className={`star ${c.fav ? 'on' : ''}`}
                aria-label={c.fav ? 'Remove from favourites' : 'Add to favourites'}
                onClick={() => setContacts((list) => list.map((x) => (x.id === c.id ? { ...x, fav: !x.fav } : x)))}
              >
                <Icon name="star" size={18} />
              </button>
              <Persona name={c.name} hue={c.hue} size={56} />
              <strong>{c.name}</strong>
              <small>{c.handle}</small>
              <span className="pill-tag">{c.kind === 'business' ? 'Business' : 'Person'}</span>
              <p className="contact-bank">{c.bank}</p>
              <p className="contact-last">{c.last ? `Last sent ${money(c.last, '$', 0)} · ${c.lastDate}` : 'No transfers yet'}</p>
              <div className="contact-acts">
                <button type="button" className="btn solid tiny" onClick={() => openModal('transfer', { to: c.name })}>
                  <Icon name="send" size={14} />
                  Send
                </button>
                <button type="button" className="btn tiny" onClick={() => openModal('request', { from: c.name })}>
                  Request
                </button>
                <button
                  type="button"
                  className="icon-btn soft sm"
                  aria-label={`Message ${c.name}`}
                  onClick={() => (chat ? go('messages', { chat: c.id }) : toast('No chat yet', `Send ${c.name.split(' ')[0]} money to start a conversation.`, { icon: 'chat' }))}
                >
                  <Icon name="chat" size={16} />
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add contact" sub="Save someone you pay often.">
        {adding ? (
          <AddContact
            onAdd={(f) => {
              const id = uid()
              setContacts((list) => [
                { id, name: f.name.trim(), handle: f.handle || '@new', bank: f.bank || 'Bank details pending', kind: f.kind, fav: true, last: 0, lastDate: '—', hue: Math.floor(Math.random() * 360) },
                ...list,
              ])
              setPickId(id)
              setAdding(false)
              toast('Contact saved', `${f.name.trim()} was added to favourites.`, { icon: 'users' })
            }}
          />
        ) : null}
      </Modal>
    </>
  )
}
