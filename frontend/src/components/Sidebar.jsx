import { motion } from 'framer-motion'
import {
  FiAlertCircle,
  FiBarChart2,
  FiGrid,
  FiInbox,
  FiLogOut,
  FiMail,
} from 'react-icons/fi'

const NAV_ITEMS = [
  { id: 'inbox', label: 'Inbox', icon: FiInbox },
  { id: 'review', label: 'Review', icon: FiAlertCircle },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2 },
  { id: 'categories', label: 'Categories', icon: FiGrid },
]

const spring = { type: 'spring', stiffness: 400, damping: 30 }

function SidebarNavItem({ item, active, onClick }) {
  const Icon = item.icon

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2, ...spring }}
      className={`sidebar-nav-item${active ? ' sidebar-nav-item--active' : ''}`}
      title={item.label}
      aria-label={item.label}
      aria-current={active ? 'page' : undefined}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          className="sidebar-nav-item__pill"
          transition={{ duration: 0.2, ...spring }}
        />
      )}
      <Icon className="sidebar-nav-item__icon" aria-hidden="true" />
    </motion.button>
  )
}

export default function Sidebar({
  activeNav,
  onNavSelect,
  userEmail,
  userName,
  userInitial,
  onLogout,
}) {
  return (
    <>
      <aside className="sidebar hidden md:flex">
        <div className="sidebar__card">
          <div className="sidebar__logo" aria-label="AI Email Manager">
            <FiMail className="sidebar__logo-icon" aria-hidden="true" />
          </div>

          <nav className="sidebar__nav" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.id}
                item={item}
                active={activeNav === item.id}
                onClick={() => onNavSelect(item.id)}
              />
            ))}
          </nav>

          <div className="sidebar__footer">
            <div className="sidebar__profile" title={userEmail}>
              <div className="sidebar__avatar">{userInitial}</div>
              <span className="sidebar__username">{userName}</span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="sidebar__logout"
              title="Sign out"
              aria-label="Sign out"
            >
              <FiLogOut className="sidebar__logout-icon" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <nav className="sidebar-mobile md:hidden" aria-label="Mobile navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = activeNav === item.id

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavSelect(item.id)}
              className={`sidebar-mobile__item${active ? ' sidebar-mobile__item--active' : ''}`}
              title={item.label}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
            </button>
          )
        })}
        <button
          type="button"
          onClick={onLogout}
          className="sidebar-mobile__item"
          title="Sign out"
          aria-label="Sign out"
        >
          <FiLogOut aria-hidden="true" />
        </button>
      </nav>
    </>
  )
}
