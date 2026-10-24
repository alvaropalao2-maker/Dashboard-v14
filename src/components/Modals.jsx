import { useState } from 'react'
import Icon from './Icon'
import BankCard from './BankCard'
import { ActivityLogo, Persona } from './Brand'
import { Modal, Segmented, Status } from './ui'
import { useApp } from '../lib/store'
import { money, stamp, uid } from '../lib/format'
import { saveFile } from '../lib/csv'
import { useTr } from '../lib/i18n'

const QUICK = [50, 100, 250, 500, 1000]

function Success({ title, body, onDone }) {
  const tr = useTr()
  return (
    <div className="success">
      <svg viewBox="0 0 80 80" className="success-mark" aria-hidden="true">
        <circle cx="40" cy="40" r="34" />
        <path d="m26 41 9.5 9.5L55 31" />
      </svg>
      <h4>{tr(title)}</h4>
      <p>{tr(body)}</p>
      <button type="button" className="btn solid lg block" onClick={onDone}>
        {tr('Done')}
      </button>
    </div>
  )
}

function MoneyForm({ mode, initial, onClose }) {
  const tr = useTr()
  const { contacts, balance, sendMoney, requestMoney } = useApp()
  const [who, setWho] = useState(initial?.to ?? initial?.from ?? '')
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const value = Number(amount)
  const tooMuch = mode === 'send' && value > balance
  const valid = who.trim() && value > 0 && !tooMuch

  const submit = (e) => {
    e.preventDefault()
    if (!valid) return
    if (mode === 'send') sendMoney({ to: who.trim(), amount: value, note })
    else requestMoney({ from: who.trim(), amount: value, note })
    setDone(true)
  }

  if (done)
    return (
      <Success
        title={mode === 'send' ? tr('Money sent') : tr('Request sent')}
        body={mode === 'send' ? tr(`${money(value)} is on its way to ${who}.`) : tr(`${who} will be asked to pay ${money(value)}.`)}
        onDone={onClose}
      />
    )

  const favs = contacts.filter((c) => c.fav)
  return (
    <form onSubmit={submit} className="form">
      <div className="field">
        <span>{mode === 'send' ? tr('Send to') : tr('Request from')}</span>
        <div className="quick-people">
          {favs.map((c) => (
            <button key={c.id} type="button" className={`qp ${who === c.name ? 'on' : ''}`} onClick={() => setWho(c.name)}>
              <Persona name={c.name} hue={c.hue} size={38} />
              <small>{c.name.split(' ')[0]}</small>
            </button>
          ))}
        </div>
        <input list="contact-names" value={who} onChange={(e) => setWho(e.target.value)} placeholder={tr('Name, @handle or IBAN')} />
        <datalist id="contact-names">
          {contacts.map((c) => (
            <option key={c.id} value={c.name} />
          ))}
        </datalist>
      </div>
      <label className="field">
        <span>{tr('Amount')}</span>
        <div className={`amount-input ${tooMuch ? 'bad' : ''}`}>
          <b>$</b>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ''))} placeholder="0.00" />
          <em>{tr('USD')}</em>
        </div>
        {tooMuch ? <small className="err">{tr('That is more than your available balance.')}</small> : <small>{tr('Available balance {amount}', { amount: money(balance) })}</small>}
      </label>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} type="button" className={`chip ${value === q ? 'on' : ''}`} onClick={() => setAmount(String(q))}>
            ${q}
          </button>
        ))}
      </div>
      <label className="field">
        <span>{tr('Note (optional)')}</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder={tr('What’s it for?')} />
      </label>
      <button type="submit" className="btn solid lg block" disabled={!valid}>
        <Icon name={mode === 'send' ? 'transfer' : 'arrowDown'} size={19} />
        {tr(mode === 'send' ? 'Send {amount}' : 'Request {amount}', { amount: value > 0 ? money(value) : '' }).trim()}
      </button>
    </form>
  )
}

export function TransferModal({ open, payload, onClose }) {
  const tr = useTr()
  return (
    <Modal open={open} onClose={onClose} title={tr('Transfer money')} sub={tr('Instant between Polplab accounts, 1–2 days to other banks.')}>
      {open ? <MoneyForm key={JSON.stringify(payload)} mode="send" initial={payload} onClose={onClose} /> : null}
    </Modal>
  )
}

export function RequestModal({ open, payload, onClose }) {
  const tr = useTr()
  return (
    <Modal open={open} onClose={onClose} title={tr('Request money')} sub={tr('We’ll send them a secure link to pay you.')}>
      {open ? <MoneyForm key={JSON.stringify(payload)} mode="request" initial={payload} onClose={onClose} /> : null}
    </Modal>
  )
}

const SKINS = [
  { key: 'onyx', label: 'Onyx' },
  { key: 'ember', label: 'Ember' },
  { key: 'ocean', label: 'Ocean' },
  { key: 'forest', label: 'Forest' },
  { key: 'violet', label: 'Violet' },
]

const randomDigits = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join('')

function AddCardForm({ onClose }) {
  const tr = useTr()
  const { user, setCards, toast } = useApp()
  const [skin, setSkin] = useState('ocean')
  const [kind, setKind] = useState('Virtual')
  const [holder, setHolder] = useState(user.name)
  const [draft] = useState(() => ({
    number: `5${randomDigits(3)} ${randomDigits(4)} ${randomDigits(4)} ${randomDigits(4)}`,
    cvv: randomDigits(3),
  }))
  const preview = {
    id: 'preview',
    skin,
    holder,
    number: draft.number,
    exp: '10/31',
    cvv: draft.cvv,
    status: 'Active',
    frozen: false,
  }
  const submit = (e) => {
    e.preventDefault()
    setCards((c) => [
      ...c,
      { ...preview, id: uid(), controls: { online: true, contactless: kind === 'Physical', atm: kind === 'Physical', abroad: false } },
    ])
    toast(tr(`${kind} card added`), tr(`Card •••• ${draft.number.slice(-4)} is ready to use.`), { icon: 'card' })
    onClose()
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="add-card-preview">
        <BankCard card={preview} />
      </div>
      <div className="field">
        <span>{tr('Card type')}</span>
        <Segmented items={['Virtual', 'Physical']} value={kind} onChange={setKind} />
      </div>
      <div className="field">
        <span>{tr('Finish')}</span>
        <div className="skins">
          {SKINS.map((s) => (
            <button key={s.key} type="button" className={`skin ${s.key} ${skin === s.key ? 'on' : ''}`} onClick={() => setSkin(s.key)} aria-label={tr(s.label)} title={tr(s.label)} />
          ))}
        </div>
      </div>
      <label className="field">
        <span>{tr('Name on card')}</span>
        <input value={holder} onChange={(e) => setHolder(e.target.value)} />
      </label>
      <button type="submit" className="btn solid lg block" disabled={!holder.trim()}>
        <Icon name="plus" size={18} />
        {tr('Create card')}
      </button>
    </form>
  )
}

export function AddCardModal({ open, onClose }) {
  const tr = useTr()
  return (
    <Modal open={open} onClose={onClose} title={tr('Add a new card')} sub={tr('Virtual cards are ready instantly. Physical cards ship in 3–5 days.')} width={480}>
      {open ? <AddCardForm onClose={onClose} /> : null}
    </Modal>
  )
}

export function ActivityModal({ open, payload, onClose }) {
  const tr = useTr()
  const { activities, updateActivity, removeActivities, toast } = useApp()
  const a = open ? activities.find((x) => x.key === payload?.key) : null
  return (
    <Modal open={open && !!a} onClose={onClose} title={tr('Transaction details')} width={440}>
      {a ? (
        <div className="receipt">
          <div className="receipt-top">
            <span className="receipt-logo">
              <ActivityLogo kind={a.logo} size={30} />
            </span>
            <h4>{tr(a.title)}</h4>
            <strong className={a.dir === 'in' ? 'pos' : ''}>
              {a.dir === 'in' ? '+' : '-'}
              {money(a.price)}
            </strong>
            <Status value={a.status} />
          </div>
          <dl>
            <div>
              <dt>{tr('Order ID')}</dt>
              <dd>{a.id}</dd>
            </div>
            <div>
              <dt>{tr('Date')}</dt>
              <dd>{tr(stamp(a.date))}</dd>
            </div>
            <div>
              <dt>{tr('Category')}</dt>
              <dd>{tr(a.category)}</dd>
            </div>
            <div>
              <dt>{tr('Paid with')}</dt>
              <dd>{a.dir === 'in' ? tr('USD wallet') : tr('Card •••• 6782')}</dd>
            </div>
            {a.note ? (
              <div>
                <dt>{tr('Note')}</dt>
                <dd>{tr(a.note)}</dd>
              </div>
            ) : null}
          </dl>
          <div className="receipt-actions">
            {a.status !== 'Completed' ? (
              <button
                type="button"
                className="btn solid"
                onClick={() => {
                  updateActivity([a.key], { status: 'Completed' })
                  toast(tr('Marked as completed'), tr(a.title))
                }}
              >
                <Icon name="check" size={17} />
                {tr('Mark completed')}
              </button>
            ) : null}
            <button
              type="button"
              className="btn"
              onClick={() =>
                saveFile(
                  `${a.id}-receipt.txt`,
                  `${tr('POLPLAB RECEIPT')}\n\n${tr(a.title)}\n${tr('Order')}: ${a.id}\n${tr('Amount')}: ${money(a.price)}\n${tr('Status')}: ${tr(a.status)}\n${tr('Date')}: ${tr(stamp(a.date))}\n`,
                )
              }
            >
              <Icon name="download" size={17} />
              {tr('Receipt')}
            </button>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                removeActivities([a.key])
                toast(tr('Transaction removed'), tr(a.title), { icon: 'trash' })
                onClose()
              }}
            >
              <Icon name="trash" size={17} />
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

export function LogoutModal({ open, onClose }) {
  const tr = useTr()
  const { signOut, user } = useApp()
  return (
    <Modal open={open} onClose={onClose} title={tr('Log out of Polplab?')} width={400}>
      <div className="logout-body">
        <span className="logout-ic">
          <Icon name="logout" size={26} />
        </span>
        <p>{tr('You’re signed in as {email}. You’ll need your password and 2FA code to sign back in.', { email: user.email })}</p>
        <div className="row-btns">
          <button type="button" className="btn lg" onClick={onClose}>
            {tr('Stay signed in')}
          </button>
          <button type="button" className="btn solid lg" onClick={signOut}>
            {tr('Log out')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
