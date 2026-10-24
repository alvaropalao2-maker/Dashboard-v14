import { useState } from 'react'
import Icon from '../components/Icon'
import { Logo, Persona } from '../components/Brand'
import { Empty, Kpi, Modal, PageHead, Segmented, Status } from '../components/ui'
import { useApp } from '../lib/store'
import { isoDay, money, shortDate } from '../lib/format'
import { saveFile } from '../lib/csv'

const TAX = 0.05
const totalOf = (inv) => inv.items.reduce((s, it) => s + it.q * it.p, 0) * (1 + TAX)
const LABEL = { paid: 'Paid', pending: 'Pending', overdue: 'Overdue' }

function NewInvoice({ onCreate }) {
  const [f, setF] = useState({ client: '', email: '', item: '', amount: '', days: '14' })
  const set = (k) => (e) => setF((d) => ({ ...d, [k]: e.target.value }))
  const valid = f.client.trim() && f.item.trim() && Number(f.amount) > 0
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault()
        if (valid) onCreate(f)
      }}
    >
      <div className="field-row">
        <label className="field">
          <span>Client</span>
          <input value={f.client} onChange={set('client')} placeholder="Company or person" />
        </label>
        <label className="field">
          <span>Billing email</span>
          <input type="email" value={f.email} onChange={set('email')} placeholder="ap@company.com" />
        </label>
      </div>
      <label className="field">
        <span>What did you do?</span>
        <input value={f.item} onChange={set('item')} placeholder="e.g. Website redesign" />
      </label>
      <div className="field-row">
        <label className="field">
          <span>Amount (USD)</span>
          <input inputMode="decimal" value={f.amount} onChange={(e) => setF((d) => ({ ...d, amount: e.target.value.replace(/[^\d.]/g, '') }))} placeholder="0.00" />
        </label>
        <label className="field">
          <span>Due in</span>
          <select value={f.days} onChange={set('days')}>
            <option value="7">7 days</option>
            <option value="14">14 days</option>
            <option value="30">30 days</option>
          </select>
        </label>
      </div>
      <button type="submit" className="btn solid lg block" disabled={!valid}>
        <Icon name="send" size={17} />
        Create &amp; send invoice
      </button>
    </form>
  )
}

export default function Invoices() {
  const { invoices, setInvoices, params, toast, booting } = useApp()
  const [filter, setFilter] = useState(params.filter ?? 'all')
  const [selId, setSelId] = useState(params.filter === 'overdue' ? invoices.find((i) => i.status === 'overdue')?.id : invoices[0]?.id)
  const [creating, setCreating] = useState(false)
  const lead = booting ? 900 : 250

  const shown = invoices.filter((i) => filter === 'all' || i.status === filter)
  const sel = invoices.find((i) => i.id === selId) ?? shown[0]
  const sum = (st) => invoices.filter((i) => st.includes(i.status)).reduce((s, i) => s + totalOf(i), 0)
  const count = (st) => invoices.filter((i) => i.status === st).length

  const setStatus = (id, status) => setInvoices((list) => list.map((i) => (i.id === id ? { ...i, status } : i)))

  return (
    <>
      <PageHead title="Invoices" sub="Create, send and get paid — track every invoice to the cent.">
        <button type="button" className="btn solid lg" onClick={() => setCreating(true)}>
          <Icon name="plus" size={18} />
          New invoice
        </button>
      </PageHead>

      <div className="kpis three">
        <Kpi icon="clock" label="Outstanding" value={sum(['pending', 'overdue'])} format={(n) => money(n)} note={`${count('pending') + count('overdue')} invoices`} delay={lead} tone="amber" />
        <Kpi icon="check" label="Paid" value={sum(['paid'])} format={(n) => money(n)} delta={18} note="vs last month" d={70} delay={lead} tone="green" />
        <Kpi icon="info" label="Overdue" value={sum(['overdue'])} format={(n) => money(n)} note={`${count('overdue')} need a nudge`} d={140} delay={lead} tone="accent" />
      </div>

      <div className="invoice-grid">
        <section className="card invoice-list-card" style={{ '--d': '200ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <Segmented
              items={[
                { key: 'all', label: 'All', count: invoices.length },
                { key: 'paid', label: 'Paid', count: count('paid') },
                { key: 'pending', label: 'Pending', count: count('pending') },
                { key: 'overdue', label: 'Overdue', count: count('overdue') },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
          <div className="inv-rows" key={filter}>
            {shown.length === 0 ? <Empty icon="note" title="No invoices here" body="Try another filter." /> : null}
            {shown.map((inv, i) => (
              <button key={inv.id} type="button" className={`inv-row ${sel?.id === inv.id ? 'on' : ''}`} style={{ '--i': i }} onClick={() => setSelId(inv.id)}>
                <Persona name={inv.client} hue={inv.hue} size={42} />
                <span className="control-txt">
                  <strong>{inv.client}</strong>
                  <small>
                    {inv.id} · due {shortDate(inv.due)}
                  </small>
                </span>
                <b>{money(totalOf(inv))}</b>
                <span className={`pill-tag ${inv.status === 'paid' ? 'green' : inv.status === 'overdue' ? 'red' : 'amber'}`}>{LABEL[inv.status]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card invoice-preview" style={{ '--d': '280ms' }}>
          {sel ? (
            <div className="paper" key={sel.id}>
              {sel.status === 'paid' ? <span className="paid-stamp">PAID</span> : null}
              <div className="paper-head">
                <div className="paper-brand">
                  <Logo size={36} />
                  <span>
                    <strong>Vertix</strong>
                    <small>Code XR Studio</small>
                  </span>
                </div>
                <div className="paper-no">
                  <small>Invoice</small>
                  <strong>{sel.id}</strong>
                </div>
              </div>
              <div className="paper-parties">
                <div>
                  <small>Billed to</small>
                  <strong>{sel.client}</strong>
                  <span>{sel.email}</span>
                </div>
                <div>
                  <small>Issued</small>
                  <strong>{shortDate(sel.issued)}</strong>
                  <small>Due</small>
                  <strong>{shortDate(sel.due)}</strong>
                </div>
              </div>
              <div className="paper-items">
                <div className="pi-row head">
                  <span>Item</span>
                  <span>Qty</span>
                  <span>Rate</span>
                  <span>Amount</span>
                </div>
                {sel.items.map((it) => (
                  <div key={it.d} className="pi-row">
                    <span>{it.d}</span>
                    <span>{it.q}</span>
                    <span>{money(it.p, '$', 0)}</span>
                    <span>{money(it.q * it.p)}</span>
                  </div>
                ))}
              </div>
              <div className="paper-total">
                <div>
                  <span>Subtotal</span>
                  <span>{money(totalOf(sel) / (1 + TAX))}</span>
                </div>
                <div>
                  <span>Tax (5%)</span>
                  <span>{money((totalOf(sel) / (1 + TAX)) * TAX)}</span>
                </div>
                <div className="grand">
                  <span>Total</span>
                  <span>{money(totalOf(sel))}</span>
                </div>
              </div>
              <div className="paper-status">
                <Status value={sel.status} label={LABEL[sel.status]} />
              </div>
              <div className="paper-actions">
                {sel.status !== 'paid' ? (
                  <button
                    type="button"
                    className="btn solid"
                    onClick={() => {
                      setStatus(sel.id, 'paid')
                      toast('Invoice paid', `${sel.id} · ${money(totalOf(sel))}`, { icon: 'check' })
                    }}
                  >
                    <Icon name="check" size={17} />
                    Mark as paid
                  </button>
                ) : null}
                {sel.status !== 'paid' ? (
                  <button type="button" className="btn" onClick={() => toast('Reminder sent', `${sel.client} got a friendly nudge.`, { icon: 'bell' })}>
                    <Icon name="bell" size={17} />
                    Remind
                  </button>
                ) : null}
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    const lines = sel.items.map((it) => `${it.d}  x${it.q}  ${money(it.q * it.p)}`).join('\n')
                    saveFile(`${sel.id}.txt`, `INVOICE ${sel.id}\nBilled to: ${sel.client}\nDue: ${shortDate(sel.due)}\n\n${lines}\n\nTotal: ${money(totalOf(sel))}\n`)
                  }}
                >
                  <Icon name="download" size={17} />
                  Download
                </button>
              </div>
            </div>
          ) : (
            <Empty icon="note" title="Pick an invoice" />
          )}
        </section>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title="New invoice" sub="We’ll email it with a secure payment link." width={520}>
        {creating ? (
          <NewInvoice
            onCreate={(f) => {
              const today = new Date()
              const due = new Date(today.getTime() + Number(f.days) * 864e5)
              const n = Math.max(...invoices.map((i) => Number(i.id.split('-')[2]))) + 1
              const id = `INV-2026-${String(n).padStart(3, '0')}`
              setInvoices((list) => [
                { id, client: f.client.trim(), email: f.email || 'billing@client.com', issued: isoDay(today), due: isoDay(due), status: 'pending', hue: Math.floor(Math.random() * 360), items: [{ d: f.item.trim(), q: 1, p: Number(f.amount) }] },
                ...list,
              ])
              setFilter('all')
              setSelId(id)
              setCreating(false)
              toast('Invoice sent', `${id} to ${f.client.trim()}`, { icon: 'send' })
            }}
          />
        ) : null}
      </Modal>
    </>
  )
}
