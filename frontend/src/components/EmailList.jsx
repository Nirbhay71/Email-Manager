import { AnimatePresence, motion } from 'framer-motion'
import {
  FiAlertCircle,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiRefreshCw,
  FiZap,
} from 'react-icons/fi'

const TAB_ITEMS = [
  { id: 'review', label: 'Needs review' },
  { id: 'classified', label: 'Auto sorted' },
  { id: 'all', label: 'All inbox' },
]

const DEFAULT_STYLE = {
  bg: '#F5F5F3',
  border: 'transparent',
  accent: '#111111',
}

function getSenderName(from = '') {
  return from.replace(/<.*?>/g, '').replace(/"/g, '').trim() || from || 'Unknown sender'
}

function formatDate(dateInput) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'Recent'
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getBodySnippet(body = '', maxLength = 165) {
  const compact = body.replace(/\s+/g, ' ').trim()
  if (!compact) return 'No body preview captured yet. Open the review workspace below to inspect the full message.'
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trim()}...` : compact
}

function getCompactCopy(value = '', maxLength = 220) {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trim()}...` : compact
}

function getStatusMeta(email) {
  if (!email.category) {
    return {
      label: 'Needs label',
      bg: '#FFFBEB',
      border: '#FEF3C7',
      color: '#D97706',
    }
  }

  if (email.needsReview) {
    return {
      label: 'Predicted',
      bg: '#FFFBEB',
      border: '#FEF3C7',
      color: '#D97706',
    }
  }

  return {
    label: 'Auto sorted',
    bg: '#ECFDF5',
    border: '#D1FAE5',
    color: '#059669',
  }
}

export default function EmailList({
  emails,
  counts,
  categories,
  categoryStyles,
  tab,
  onTabChange,
  selectedEmailId,
  onSelectEmail,
  actionId,
  onLabel,
  onFeedback,
  onRefresh,
  searchQuery,
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="premium-glass rounded-[28px] p-8"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-[28px] font-semibold tracking-tight text-[#111111]">Email queue</h2>
          <p className="mt-1 max-w-2xl text-[16px] text-[#707070]">
            Review AI predictions, categorize new senders, and train your model.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-[20px] border border-[rgba(0,0,0,0.08)] bg-[rgba(0,0,0,0.02)] p-1">
            {TAB_ITEMS.map((item) => {
              const active = tab === item.id
              const count = item.id === 'review'
                ? counts.review
                : item.id === 'classified'
                  ? counts.classified
                  : counts.all

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`rounded-[16px] px-4 py-2 text-[14px] font-medium transition-all ${
                    active ? 'bg-white text-[#111111] shadow-sm ring-1 ring-black/5' : 'text-[#707070] hover:text-[#111111]'
                  }`}
                >
                  {item.label}
                  <span className="ml-2 text-[12px] opacity-60">{count}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="flex h-10 items-center justify-center gap-2 rounded-[18px] bg-white border border-[rgba(0,0,0,0.05)] px-4 text-[14px] font-medium text-[#111111] shadow-sm transition hover:bg-gray-50"
          >
            <FiRefreshCw className="h-4 w-4" />
            Sync
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-[13px] text-[#A1A1AA]">
        <span>{emails.length} visible messages</span>
        <span className="h-1 w-1 rounded-full bg-[#E4E4E7]" />
        <span>Search scans sender, subject, body, category, and AI notes</span>
      </div>

      <div className="scrollbar-thin mt-6 max-h-[720px] space-y-2 overflow-y-auto pr-2">
        {emails.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-[#E4E4E7] bg-[#F5F5F3] px-5 py-12 text-center text-[15px] text-[#707070]">
            {searchQuery
              ? 'No emails match this search yet. Try a different sender, category, or AI note.'
              : tab === 'review'
                ? 'All caught up. Nothing needs review right now.'
                : tab === 'classified'
                  ? 'Auto-sorted mail will appear here once the model has enough examples.'
                  : 'The inbox is empty right now.'}
          </div>
        ) : (
          emails.map((email, index) => {
            const selected = selectedEmailId === email.messageId
            const confidence = email.confidence ? Math.round(email.confidence * 100) : 0
            const status = getStatusMeta(email)

            return (
              <motion.article
                key={email.messageId}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02, duration: 0.2 }}
                whileHover={{ scale: 1.002 }}
                onClick={() => onSelectEmail(email.messageId)}
                className={`cursor-pointer rounded-[24px] p-4 transition-all duration-200 ${
                  selected
                    ? 'bg-[#F5F5F3] border border-[rgba(0,0,0,0.05)] shadow-sm'
                    : 'bg-transparent border border-transparent hover:bg-white hover:border-[rgba(0,0,0,0.05)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.03)]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-2.5 h-[8px] w-[8px] shrink-0 rounded-full ${email.needsReview || !email.category ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="truncate text-[15px] font-semibold text-[#111111]">
                        {getSenderName(email.from)}
                      </h3>
                      <span className="shrink-0 text-[13px] text-[#A1A1AA]">
                        {formatDate(email.createdAt)}
                      </span>
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-3">
                      <p className="truncate text-[14px] font-semibold text-[#111111] max-w-[50%]">
                        {email.subject || '(no subject)'}
                      </p>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            background: status.bg,
                            borderColor: status.border,
                            color: status.color,
                          }}
                        >
                          {status.label}
                        </span>

                        {email.category && (
                          <span className="rounded-full bg-white border border-[#E4E4E7] px-2 py-0.5 text-[11px] font-medium text-[#111111]">
                            {email.category}
                          </span>
                        )}

                        {confidence > 0 && (
                          <span className="rounded-full border border-[#E4E4E7] bg-white px-2 py-0.5 text-[11px] font-medium text-[#707070]">
                            {confidence}%
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="mt-1 truncate text-[14px] text-[#707070]">
                      {getBodySnippet(email.body, 140)}
                    </p>

                    <AnimatePresence initial={false}>
                      {selected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 grid gap-6 border-t border-[#E4E4E7] pt-5 lg:grid-cols-[1.5fr_1fr]">
                            <div>
                              <div className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                                <FiZap className="h-[14px] w-[14px]" />
                                AI Reasoning
                              </div>
                              <p className="mt-2 text-[14px] leading-relaxed text-[#707070]">
                                {getCompactCopy(email.classifyReasoning, 520) || 'Open the preview workspace below for the full reasoning trace.'}
                              </p>
                            </div>

                            <div>
                              <div className="flex items-center justify-between gap-3 text-[12px] font-semibold uppercase tracking-widest text-[#A1A1AA]">
                                Quick actions
                                <FiChevronRight className="h-[14px] w-[14px]" />
                              </div>

                              <div className="mt-3 space-y-2">
                                {actionId === email.messageId ? (
                                  <div className="flex items-center gap-3 rounded-[16px] bg-white border border-[#E4E4E7] px-4 py-2.5 text-[14px] font-medium text-[#707070]">
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#A1A1AA] border-t-transparent" />
                                    Updating classifier...
                                  </div>
                                ) : categories.length === 0 ? (
                                  <div className="rounded-[16px] border border-dashed border-[#E4E4E7] bg-white px-4 py-3 text-[14px] text-[#707070]">
                                    Create a category to train the model from this email.
                                  </div>
                                ) : (
                                  <>
                                    {email.category && email.needsReview && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          onFeedback(email.messageId, email.category, email.category)
                                        }}
                                        className="flex w-full items-center justify-center rounded-[16px] bg-[#111111] px-4 py-2.5 text-[14px] font-medium text-white transition hover:bg-black/80 shadow-[0_4px_14px_rgba(0,0,0,0.1)]"
                                      >
                                        <FiCheckCircle className="mr-2 h-4 w-4" />
                                        Accept {email.category}
                                      </button>
                                    )}

                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {categories.slice(0, 6).map((category) => {
                                        const active = email.category === category.name

                                        return (
                                          <button
                                            key={category.name}
                                            type="button"
                                            onClick={(event) => {
                                              event.stopPropagation()
                                              if (email.category) {
                                                onFeedback(email.messageId, email.category, category.name)
                                              } else {
                                                onLabel(email.messageId, category.name)
                                              }
                                            }}
                                            className={`rounded-[12px] px-3 py-1.5 text-[13px] font-medium transition ${
                                              active
                                                ? 'bg-[#111111] text-white shadow-sm'
                                                : 'bg-white text-[#707070] border border-[#E4E4E7] hover:bg-[#F4F4F5] hover:text-[#111111]'
                                            }`}
                                          >
                                            {category.name}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.article>
            )
          })
        )}
      </div>
    </motion.section>
  )
}
