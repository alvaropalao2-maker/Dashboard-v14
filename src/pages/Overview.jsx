import { useState } from 'react'
import Icon from '../components/Icon'
import BankCard from '../components/BankCard'
import ActivityTable from '../components/ActivityTable'
import { Flag } from '../components/Brand'
import { PnlChart } from '../components/Charts'
import { CountUp, Delta, PageHead, Popover } from '../components/ui'
import { useApp } from '../lib/store'
import { money } from '../lib/format'
import { CURRENCIES, PNL, STATS } from '../data/seed'
import { useTr } from '../lib/i18n'

function WalletCard({ w, i, delay }) {
  const tr = useTr()
  const { setWalletStatus, go, openModal } = useApp()
  const [menu, setMenu] = useState(false)
  return (
    <div className={`wallet ${w.status} ${menu ? 'menu-open' : ''}`} style={{ '--w': i }}>
      <div className="w-head">
        <Flag code={w.flag} size={18} />
        <b>{w.code}</b>
        <button type="button" className="w-dots" onClick={() => setMenu((m) => !m)} aria-label={tr(`${w.code} wallet options`)}>
          <Icon name={menu ? 'close' : 'dotsV'} size={menu ? 14 : 16} stroke={menu ? 2 : 2.6} />
        </button>
      </div>
      <strong>
        <CountUp value={w.amount} format={(n) => money(n, w.symbol)} delay={delay + i * 80} duration={1200} />
      </strong>
      <small>{tr('Limit is {limit} a month', { limit: w.limit })}</small>
      <em>{w.status === 'active' ? tr('Active') : tr('Inactive')}</em>

      <div className="w-menu" aria-hidden={!menu}>
        <button
          type="button"
          tabIndex={menu ? 0 : -1}
          onClick={() => {
            setMenu(false)
            setWalletStatus(w.id, w.status === 'active' ? 'inactive' : 'active')
          }}
        >
          <Icon name={w.status === 'active' ? 'lock' : 'check'} size={14} />
          {w.status === 'active' ? tr('Deactivate') : tr('Activate')}
        </button>
        <button
          type="button"
          tabIndex={menu ? 0 : -1}
          disabled={w.status !== 'active'}
          onClick={() => {
            setMenu(false)
            openModal('transfer')
          }}
        >
          <Icon name="send" size={14} />
          {tr('Send')}
        </button>
        <button type="button" tabIndex={menu ? 0 : -1} onClick={() => go('manage')}>
          <Icon name="gear" size={14} />
          {tr('Manage')}
        </button>
      </div>
    </div>
  )
}

export default function Overview() {
  const tr = useTr()
  const { user, currency, setCurrency, balance, wallets, spend, cards, openModal, go, booting } = useApp()
  const [hot, setHot] = useState('earnings')
  const [curOpen, setCurOpen] = useState(false)
  const [flipped, setFlipped] = useState(null)
  const cur = CURRENCIES[currency]
  const lead = booting ? 1050 : 250
  const pct = Math.min(100, (spend.spent / spend.limit) * 100)

  return (
    <>
      <PageHead title={tr(`Good morning, ${user.first}`)} sub={tr('Stay on top of your tasks, monitor progress, and track status.')} />

      <div className="ov-grid">
        {/* ---------------- Total balance ---------------- */}
        <section className="card balance-card" style={{ '--d': '0ms' }}>
          <div className="bal-head rv" style={{ '--i': 0 }}>
            <span className="card-label">{tr('Total Balance')}</span>
            <div className="anchor">
              <button type="button" className={`cur-btn ${curOpen ? 'on' : ''}`} onClick={() => setCurOpen((o) => !o)} aria-label={tr('Change currency')}>
                <Flag code={cur.flag} size={19} />
                {cur.code}
                <Icon name="chevDown" size={14} stroke={2} />
              </button>
              <Popover open={curOpen} onClose={() => setCurOpen(false)} className="cur-pop">
                {Object.values(CURRENCIES).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    className={`cur-opt ${c.code === currency ? 'on' : ''}`}
                    onClick={() => {
                      setCurrency(c.code)
                      setCurOpen(false)
                    }}
                  >
                    <Flag code={c.flag} size={20} />
                    <span>
                      <b>{c.code}</b>
                      <small>{tr(c.name)}</small>
                    </span>
                    {c.code === currency ? <Icon name="check" size={16} stroke={2.2} /> : null}
                  </button>
                ))}
              </Popover>
            </div>
          </div>

          <div className="bal-amount rv" style={{ '--i': 1 }}>
            <CountUp value={balance * cur.rate} format={(n) => money(n, cur.symbol)} delay={lead} duration={1700} />
          </div>
          <div className="bal-delta rv" style={{ '--i': 2 }}>
            <Delta value={5} />
            <span>{tr('than last month')}</span>
          </div>

          <div className="bal-actions rv" style={{ '--i': 3 }}>
            <button type="button" className="btn solid xl" onClick={() => openModal('transfer')}>
              <Icon name="transfer" size={20} />
              {tr('Transfer')}
            </button>
            <button type="button" className="btn soft xl" onClick={() => openModal('request')}>
              <Icon name="transfer" size={20} />
              {tr('Request')}
            </button>
          </div>

          <div className="wallets rv" style={{ '--i': 4 }}>
            <div className="wallets-head">
              <b>{tr('Wallets')}</b>
              <i />
              <span>{tr('Total {count} wallets', { count: wallets.length })}</span>
            </div>
            <div className="wallet-track">
              {wallets.map((w, i) => (
                <WalletCard key={w.id} w={w} i={i} delay={lead + 300} />
              ))}
            </div>
          </div>
        </section>

        {/* ---------------- Stat tiles ---------------- */}
        <section className="card stats-card" style={{ '--d': '90ms' }}>
          {STATS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`stat ${hot === s.id ? 'hot' : ''}`}
              style={{ '--s': i }}
              onClick={() => setHot(s.id)}
              aria-pressed={hot === s.id}
            >
              <span className="stat-glow" aria-hidden="true" />
              <span className="stat-head">
                <span>{tr(s.label)}</span>
                <i className="stat-ic">
                  <Icon name={s.icon} size={17} />
                </i>
              </span>
              <strong className="stat-val">
                <CountUp value={s.value} format={(n) => `$${Math.round(n).toLocaleString('en-US')}`} delay={lead + 150 + i * 90} />
              </strong>
              <span className="stat-foot">
                <Delta value={s.delta} glass={hot === s.id} />
                <span>{tr('This month')}</span>
              </span>
            </button>
          ))}
        </section>

        {/* ---------------- Total income ---------------- */}
        <section className="card income-card" style={{ '--d': '180ms' }}>
          <h2 className="card-title big rv" style={{ '--i': 0 }}>
            {tr('Total Income')}
          </h2>
          <p className="card-sub rv" style={{ '--i': 1 }}>
            {tr('View your income in a certain period of time')}
          </p>
          <div className="pnl-panel">
            <PnlChart data={PNL} />
          </div>
        </section>

        <div className="ov-left">
          {/* ---------------- Spending limit ---------------- */}
          <section className="card limit-card" style={{ '--d': '260ms' }}>
            <h2 className="card-title rv" style={{ '--i': 0 }}>
              {tr('Monthly Spending Limit')}
            </h2>
            <button type="button" className="limit-bar rv" style={{ '--i': 1 }} onClick={() => go('manage')} aria-label={tr('Adjust spending limit')}>
              <span className={`limit-fill ${pct >= 90 ? 'warn' : ''}`} style={{ width: `${pct}%` }}>
                <em className="limit-tip">{tr('{pct}% used · Adjust', { pct: Math.round(pct) })}</em>
              </span>
            </button>
            <div className="limit-foot rv" style={{ '--i': 2 }}>
              <span>
                <b>
                  <CountUp value={spend.spent} format={(n) => money(n)} delay={lead + 200} />
                </b>{' '}
                {tr('spent out of')}
              </span>
              <b>{money(spend.limit)}</b>
            </div>
          </section>

          {/* ---------------- My cards ---------------- */}
          <section className="card cards-card" style={{ '--d': '340ms' }}>
            <div className="cards-head rv" style={{ '--i': 0 }}>
              <span className="ring-ic">
                <Icon name="card" size={20} />
              </span>
              <h2 className="card-title">{tr('My Cards')}</h2>
              <button type="button" className="add-new" onClick={() => openModal('addCard')}>
                <Icon name="plus" size={16} stroke={2} />
                {tr('Add new')}
              </button>
            </div>
            <div className="cards-track">
              {cards.map((c, i) => (
                <BankCard
                  key={c.id}
                  card={c}
                  flipped={flipped === c.id}
                  onClick={() => setFlipped((f) => (f === c.id ? null : c.id))}
                  style={{ '--k': i }}
                />
              ))}
            </div>
          </section>
        </div>

        {/* ---------------- Recent activities ---------------- */}
        <section className="card activity-card" style={{ '--d': '300ms' }}>
          <ActivityTable initialSelected={['a4']} />
        </section>
      </div>
    </>
  )
}
