import { motion } from 'framer-motion'
import { FiBell, FiRefreshCw, FiSearch } from 'react-icons/fi'

const spring = { type: 'spring', stiffness: 400, damping: 30 }

export default function TopNav({
  title,
  subtitle,
  searchQuery,
  onSearchChange,
  searchInputRef,
  onRefresh,
  needsReviewCount,
  metaDate,
  shortDate,
  visibleEmailsCount,
  liveCategoriesCount,
}) {
  return (
    <header className="top-nav">
      <div className="top-nav__row">
        <div className="top-nav__title-block">
          <p className="top-nav__eyebrow">AI Email Manager</p>
          <h1 className="top-nav__title">{title}</h1>
        </div>

        <div className="top-nav__actions">
          <div className="top-nav__meta-pill" aria-label="Today's date">
            <span className="top-nav__meta-pill-text">{shortDate}</span>
          </div>

          <label className="top-nav__search">
            <FiSearch className="top-nav__search-icon" aria-hidden="true" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={onSearchChange}
              placeholder="Search emails, senders, categories"
              className="top-nav__search-input"
              aria-label="Search emails, senders, categories, AI notes"
            />
          </label>

          <motion.button
            type="button"
            onClick={onRefresh}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ...spring }}
            className="top-nav__action-btn top-nav__action-btn--text"
          >
            <FiRefreshCw className="top-nav__action-icon" aria-hidden="true" />
            <span>Refresh</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2, ...spring }}
            className="top-nav__action-btn top-nav__action-btn--icon"
            title="Notifications"
            aria-label="Notifications"
          >
            <FiBell className="top-nav__action-icon" aria-hidden="true" />
            {needsReviewCount > 0 && (
              <span className="top-nav__badge">{needsReviewCount}</span>
            )}
          </motion.button>
        </div>
      </div>

      <div className="top-nav__footer">
        <p className="top-nav__subtitle">{subtitle}</p>
        <div className="top-nav__meta" aria-label="Inbox summary">
          <span>{metaDate}</span>
          <span className="top-nav__meta-dot" aria-hidden="true" />
          <span>{visibleEmailsCount} visible emails</span>
          <span className="top-nav__meta-dot" aria-hidden="true" />
          <span>{liveCategoriesCount} live categories</span>
        </div>
      </div>
    </header>
  )
}
