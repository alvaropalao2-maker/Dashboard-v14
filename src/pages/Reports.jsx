import { useState } from 'react'
import Icon from '../components/Icon'
import { Donut, LineChart } from '../components/Charts'
import { Kpi, PageHead, Segmented } from '../components/ui'
import { useApp } from '../lib/store'
import { saveFile, toCsv } from '../lib/csv'
import { REPORTS, STATEMENTS } from '../data/seed'
import { useTr } from '../lib/i18n'

const PALETTE = ['var(--accent)', 'var(--loss)', '#f5b400', '#3f74f6', '#22a05a']
const PERIODS = [
  { key: 'week', label: 'This week' },
  { key: 'month', label: 'This month' },
  { key: 'year', label: 'This year' },
]

const k = (n) => `$${n.toLocaleString('en-US', { maximumFractionDigits: 1 })}k`

export default function Reports() {
  const tr = useTr()
  const { activities, toast, booting } = useApp()
  const [period, setPeriod] = useState('month')
  const [slice, setSlice] = useState(null)
  const data = REPORTS[period]
  const income = data.income.reduce((s, v) => s + v, 0)
  const expense = data.expense.reduce((s, v) => s + v, 0)
  const net = income - expense
  const catTotal = data.categories.reduce((s, c) => s + c.v, 0)
  const lead = booting ? 900 : 250
  const focus = slice != null ? data.categories[slice] : null

  return (
    <>
      <PageHead title={tr('Reports')} sub={tr('See where your money comes from — and where it goes.')}>
        <Segmented items={PERIODS} value={period} onChange={setPeriod} />
        <button
          type="button"
          className="btn solid lg"
          onClick={() => {
            saveFile('polplab-transactions.csv', toCsv(activities), 'text/csv')
            toast(tr('Export ready'), tr(`${activities.length} transactions saved as CSV.`), { icon: 'download' })
          }}
        >
          <Icon name="download" size={18} />
          {tr('Export CSV')}
        </button>
      </PageHead>

      <div className="kpis" key={period}>
        <Kpi icon="arrowDown" label={tr('Income')} value={income} format={k} delta={8} note={tr('vs last period')} delay={lead} tone="green" />
        <Kpi icon="arrowUpRight" label={tr('Expenses')} value={expense} format={k} delta={-3} note={tr('vs last period')} d={70} delay={lead} tone="accent" />
        <Kpi icon="trend" label={tr('Net profit')} value={net} format={k} delta={14} note={tr('vs last period')} d={140} delay={lead} />
        <Kpi icon="pie" label={tr('Savings rate')} value={(net / income) * 100} format={(n) => `${n.toFixed(1)}%`} note={tr('of income kept')} d={210} delay={lead} tone="blue" />
      </div>

      <div className="reports-grid">
        <section className="card chart-card" style={{ '--d': '200ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <div>
              <h2 className="card-title big">{tr('Income vs expenses')}</h2>
              <p className="card-sub">{tr('Hover the chart to compare any point.')}</p>
            </div>
            <div className="legend static">
              <span>
                <i className="sw" style={{ background: 'var(--accent)' }} />
                {tr('Income')}
              </span>
              <span>
                <i className="sw" style={{ background: 'var(--loss)' }} />
                {tr('Expenses')}
              </span>
            </div>
          </div>
          <div className="rv" style={{ '--i': 1 }} key={period}>
            <LineChart
              labels={data.labels}
              series={[
                { name: 'Income', values: data.income, color: 'var(--accent)', fill: true },
                { name: 'Expenses', values: data.expense, color: 'var(--loss)' },
              ]}
              height={270}
            />
          </div>
        </section>

        <section className="card donut-card" style={{ '--d': '280ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Spending by category')}</h2>
          </div>
          <div className="donut-wrap rv" style={{ '--i': 1 }} key={period}>
            <Donut data={data.categories} colors={PALETTE} active={slice} onActive={setSlice}>
              <small>{focus ? tr(focus.name) : tr('Total spent')}</small>
              <strong>{k(focus ? focus.v : catTotal)}</strong>
              <em>{focus ? `${((focus.v / catTotal) * 100).toFixed(1)}%` : tr(PERIODS.find((p) => p.key === period).label)}</em>
            </Donut>
          </div>
          <ul className="cat-list">
            {data.categories.map((c, i) => (
              <li
                key={c.name}
                className={`rv ${slice === i ? 'hot' : ''} ${slice != null && slice !== i ? 'dim' : ''}`}
                style={{ '--i': i + 2 }}
                onMouseEnter={() => setSlice(i)}
                onMouseLeave={() => setSlice(null)}
              >
                <i className="sw" style={{ background: PALETTE[i] }} />
                <span>{tr(c.name)}</span>
                <div className="cat-bar">
                  <span style={{ width: `${(c.v / data.categories[0].v) * 100}%`, background: PALETTE[i] }} />
                </div>
                <b>{((c.v / catTotal) * 100).toFixed(0)}%</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="card statements-card" style={{ '--d': '340ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">{tr('Statements')}</h2>
            <span className="muted">{tr('PDF-ready text exports')}</span>
          </div>
          <div className="statement-list">
            {STATEMENTS.map((s, i) => (
              <div key={s.id} className="statement rv" style={{ '--i': i + 1 }}>
                <span className="doc-ic">
                  <Icon name="note" size={20} />
                </span>
                <span className="control-txt">
                  <strong>{tr(s.name)}</strong>
                  <small>{tr(s.meta)}</small>
                </span>
                <button
                  type="button"
                  className="icon-btn soft"
                  aria-label={tr(`Download ${s.name}`)}
                  onClick={() => {
                    saveFile(`${s.name.toLowerCase().replace(/\s+/g, '-')}.txt`, `POLPLAB — ${tr(s.name)}\n${tr(s.meta)}\n\n${tr('Income')}: ${k(income)}\n${tr('Expenses')}: ${k(expense)}\n${tr('Net')}: ${k(net)}\n`)
                    toast(tr('Statement downloaded'), tr(s.name), { icon: 'download' })
                  }}
                >
                  <Icon name="download" size={18} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
