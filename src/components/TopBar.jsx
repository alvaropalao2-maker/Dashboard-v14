import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import Icon from './Icon'
import { Avatar, Logo } from './Brand'
import { MenuItem, Popover } from './ui'
import { useApp } from '../lib/store'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'activity', label: 'Activity' },
  { id: 'manage', label: 'Manage' },
  { id: 'program', label: 'Program' },
  { id: 'account', label: 'Account' },
  { id: 'reports', label: 'Reports' },
]

export default function TopBar() {
  const app = useApp()
  const { view, go, user, notifications, setNotifications, wallets, spend } = app
  const nav = useRef(null)
  const ind = useRef(null)
  const [open, setOpen] = useState(null)
  const close = useCallback(() => setOpen(null), [])
  const toggle = (k) => setOpen((o) => (o === k ? null : k))

  useLayoutEffect(() => {
    const place = () => {
      const btn = nav.current?.querySelector(`[data-tab="${view}"]`)
      const el = ind.current
      if (!el) return
      if (!btn) {
        el.style.opacity = '0'
        return
      }
      el.style.opacity = '1'
      el.style.width = `${btn.offsetWidth}px`
      el.style.transform = `translateX(${btn.offsetLeft}px)`
      const n = nav.current
      if (n.scrollWidth > n.clientWidth) n.scrollTo({ left: btn.offsetLeft - 24, behavior: 'smooth' })
    }
    place()
    const ro = new ResizeObserver(place)
    ro.observe(nav.current)
    return () => ro.disconnect()
  }, [view])

  const unread = notifications.filter((n) => n.unread).length
  const inactive = wallets.filter((w) => w.status === 'inactive')
  const pct = Math.round((spend.spent / spend.limit) * 100)

  return (
    <header className="topbar">
      <button type="button" className="pill brand" onClick={() => go('overview')} aria-label="Vertix home">
        <Logo />
        <span className="brand-name">Vertix</span>
      </button>

      <nav className="pill nav" ref={nav} aria-label="Primary">
        <span className="nav-ind" ref={ind} />
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            data-tab={t.id}
            className={view === t.id ? 'on' : ''}
            style={{ '--i': i }}
            onClick={() => go(t.id)}
            aria-current={view === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="pill tools">
        <button type="button" className="tool" onClick={app.openPalette} aria-label="Search (⌘K)" title="Search  ⌘K">
          <Icon name="search" size={23} />
        </button>

        <div className="anchor">
          <button type="button" className={`tool ${open === 'bell' ? 'on' : ''}`} onClick={() => toggle('bell')} aria-label="Notifications">
            <Icon name="bell" size={23} />
            {unread ? <i className="bell-dot" /> : null}
          </button>
          <Popover open={open === 'bell'} onClose={close} className="notif-pop">
            <div className="pop-head">
              <strong>Notifications</strong>
              <button
                type="button"
                className="link"
                disabled={!unread}
                onClick={() => setNotifications((n) => n.map((x) => ({ ...x, unread: false })))}
              >
                Mark all as read
              </button>
            </div>
            <div className="notif-list">
              {notifications.slice(0, 6).map((n, i) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif ${n.unread ? 'unread' : ''}`}
                  style={{ '--i': i }}
                  onClick={() => setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, unread: false } : x)))}
                >
                  <span className={`notif-ic ${n.tone}`}>
                    <Icon name={n.icon} size={16} stroke={2} />
                  </span>
                  <span className="notif-txt">
                    <strong>{n.title}</strong>
                    <small>{n.body}</small>
                  </span>
                  <em>{n.time}</em>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="pop-foot"
              onClick={() => {
                close()
                go('activity')
              }}
            >
              View all activity <Icon name="arrowRight" size={15} />
            </button>
          </Popover>
        </div>

        <div className="anchor">
          <button type="button" className={`tool ${open === 'info' ? 'on' : ''}`} onClick={() => toggle('info')} aria-label="Alerts">
            <Icon name="info" size={23} />
          </button>
          <Popover open={open === 'info'} onClose={close} className="alert-pop">
            <div className="pop-head">
              <strong>Account alerts</strong>
              <span className="pop-badge">{inactive.length + 3}</span>
            </div>
            {inactive.map((w) => (
              <div className="alert-row" key={w.id}>
                <span className="notif-ic red">
                  <Icon name="lock" size={16} stroke={2} />
                </span>
                <span className="notif-txt">
                  <strong>{w.code} wallet is inactive</strong>
                  <small>Payments in {w.code} are on hold.</small>
                </span>
                <button type="button" className="btn tiny solid" onClick={() => app.setWalletStatus(w.id, 'active')}>
                  Activate
                </button>
              </div>
            ))}
            <div className="alert-row">
              <span className="notif-ic accent">
                <Icon name="chart" size={16} stroke={2} />
              </span>
              <span className="notif-txt">
                <strong>{pct}% of monthly limit used</strong>
                <small>Adjust the limit from card controls.</small>
              </span>
              <button
                type="button"
                className="btn tiny"
                onClick={() => {
                  close()
                  go('manage')
                }}
              >
                Adjust
              </button>
            </div>
            <div className="alert-row">
              <span className="notif-ic amber">
                <Icon name="note" size={16} stroke={2} />
              </span>
              <span className="notif-txt">
                <strong>2 invoices are overdue</strong>
                <small>Send a reminder in one tap.</small>
              </span>
              <button
                type="button"
                className="btn tiny"
                onClick={() => {
                  close()
                  go('invoices', { filter: 'overdue' })
                }}
              >
                View
              </button>
            </div>
            <div className="alert-row">
              <span className="notif-ic blue">
                <Icon name="shield" size={16} stroke={2} />
              </span>
              <span className="notif-txt">
                <strong>New sign-in from iPhone</strong>
                <small>Dhaka, Bangladesh · 2 hours ago</small>
              </span>
              <button
                type="button"
                className="btn tiny"
                onClick={() => {
                  close()
                  go('account')
                }}
              >
                Review
              </button>
            </div>
          </Popover>
        </div>
      </div>

      <div className="anchor">
        <button type="button" className={`pill user ${open === 'user' ? 'on' : ''}`} onClick={() => toggle('user')} aria-label="Account menu">
          <Avatar />
          <span className="user-txt">
            <strong>{user.name}</strong>
            <small>{user.email}</small>
          </span>
          <Icon name="chevDown" size={18} className="user-chev" />
        </button>
        <Popover open={open === 'user'} onClose={close} className="user-pop">
          <div className="user-card">
            <Avatar size={44} />
            <div>
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          </div>
          <MenuItem icon="user" onClick={() => (close(), go('account'))}>
            My account
          </MenuItem>
          <MenuItem icon="gear" onClick={() => (close(), go('settings'))}>
            Settings
          </MenuItem>
          <MenuItem icon="help" onClick={() => (close(), go('help'))}>
            Help Center
          </MenuItem>
          <MenuItem icon="replay" onClick={() => (close(), app.replayIntro())}>
            Replay intro animation
          </MenuItem>
          <hr />
          <MenuItem icon="logout" tone="danger" onClick={() => (close(), app.openModal('logout'))}>
            Log out
          </MenuItem>
        </Popover>
      </div>
    </header>
  )
}
