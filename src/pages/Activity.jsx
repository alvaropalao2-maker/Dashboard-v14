import Icon from '../components/Icon'
import ActivityTable from '../components/ActivityTable'
import { ActivityLogo } from '../components/Brand'
import { Kpi, PageHead } from '../components/ui'
import { useApp } from '../lib/store'
import { money, stamp } from '../lib/format'

const dollars = (n) => money(n, '$', 0)

export default function Activity() {
  const { activities, openModal, booting } = useApp()
  const sum = (dir) => activities.filter((a) => a.dir === dir).reduce((s, a) => s + a.price, 0)
  const pending = activities.filter((a) => a.status !== 'Completed')
  const lead = booting ? 900 : 300

  return (
    <>
      <PageHead title="Activity" sub="Every payment, transfer and request — searchable, sortable, all in one place.">
        <button type="button" className="btn ghost lg" onClick={() => openModal('request')}>
          <Icon name="arrowDown" size={18} />
          Request
        </button>
        <button type="button" className="btn solid lg" onClick={() => openModal('transfer')}>
          <Icon name="transfer" size={18} />
          New transfer
        </button>
      </PageHead>

      <div className="kpis">
        <Kpi icon="receipt" label="Transactions" value={activities.length} delta={12} note="vs March" delay={lead} />
        <Kpi icon="arrowDown" label="Money in" value={sum('in')} format={dollars} delta={8} note="This month" d={70} delay={lead} tone="green" />
        <Kpi icon="arrowUpRight" label="Money out" value={sum('out')} format={dollars} delta={-5} note="This month" d={140} delay={lead} tone="accent" />
        <Kpi icon="clock" label="Awaiting" value={pending.length} note={`${dollars(pending.reduce((s, a) => s + a.price, 0))} on hold`} d={210} delay={lead} tone="amber" />
      </div>

      <div className="act-layout">
        <section className="card activity-card" style={{ '--d': '240ms' }}>
          <ActivityTable variant="full" />
        </section>

        <section className="card feed-card" style={{ '--d': '320ms' }}>
          <div className="section-head rv" style={{ '--i': 0 }}>
            <h2 className="card-title big">Live feed</h2>
            <span className="live-dot">Live</span>
          </div>
          <ol className="timeline">
            {activities.slice(0, 7).map((a, i) => (
              <li key={a.key} className="rv" style={{ '--i': i + 1 }}>
                <span className={`tl-dot ${a.status === 'Completed' ? 'green' : a.status === 'Pending' ? 'red' : 'amber'}`} />
                <button type="button" className="tl-body" onClick={() => openModal('activity', { key: a.key })}>
                  <ActivityLogo kind={a.logo} size={30} />
                  <span className="tl-txt">
                    <strong>{a.title}</strong>
                    <small>{stamp(a.date)}</small>
                  </span>
                  <b className={a.dir === 'in' ? 'pos' : ''}>
                    {a.dir === 'in' ? '+' : '-'}
                    {dollars(a.price)}
                  </b>
                </button>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  )
}
