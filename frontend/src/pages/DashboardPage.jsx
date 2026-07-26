import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  FiAlertCircle,
  FiBarChart2,
  FiCheckCircle,
  FiChevronRight,
  FiClock,
  FiGrid,
  FiLayers,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiZap,
} from 'react-icons/fi'
import EmailList from '../components/EmailList'
import Sidebar from '../components/Sidebar'
import TopNav from '../components/TopNav'

const API = 'http://localhost:5000'

const CATEGORY_TINTS = [
  '#6C63FF',
  '#38BDF8',
  '#F59E0B',
  '#34D399',
  '#FB7185',
  '#A78BFA',
  '#14B8A6',
  '#F97316',
]

const CARD_TONES = {
  violet: { accent: '#6C63FF', glow: 'rgba(108, 99, 255, 0.34)' },
  amber: { accent: '#F59E0B', glow: 'rgba(245, 158, 11, 0.3)' },
  emerald: { accent: '#34D399', glow: 'rgba(52, 211, 153, 0.3)' },
  cyan: { accent: '#38BDF8', glow: 'rgba(56, 189, 248, 0.3)' },
}

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '')
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized
  const value = Number.parseInt(expanded, 16)
  const r = (value >> 16) & 255
  const g = (value >> 8) & 255
  const b = value & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function normalizeText(value) {
  return (value || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

function getSenderName(from = '') {
  return from.replace(/<.*?>/g, '').replace(/"/g, '').trim() || from || 'Unknown sender'
}

function getSenderAddress(from = '') {
  const match = from.match(/<([^>]+)>/)
  return match?.[1] || from || 'No email address'
}

function getSenderDomain(from = '') {
  const address = getSenderAddress(from)
  return address.includes('@') ? address.split('@')[1] : address
}

function formatLongDate(dateInput) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return 'Recently received'
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function getDayKey(dateInput) {
  const date = new Date(dateInput)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function getBodySnippet(body = '', maxLength = 170) {
  const compact = body.replace(/\s+/g, ' ').trim()
  if (!compact) return 'Open the preview workspace to inspect this message and decide how the model should learn from it.'
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trim()}...` : compact
}

function getEmailSummary(body = '') {
  const compact = body.replace(/\s+/g, ' ').trim()
  if (!compact) {
    return 'No body content was captured for this message yet, so the review workspace is leaning on subject, sender, and category signals.'
  }

  const sentences = compact.match(/[^.!?]+[.!?]*/g)?.map((sentence) => sentence.trim()).filter(Boolean) || []
  const summary = sentences.slice(0, 2).join(' ')
  if (summary) return summary
  return compact.length > 240 ? `${compact.slice(0, 240).trim()}...` : compact
}

function getCompactCopy(value = '', maxLength = 165) {
  const compact = value.replace(/\s+/g, ' ').trim()
  if (!compact) return ''
  return compact.length > maxLength ? `${compact.slice(0, maxLength).trim()}...` : compact
}

function getCategoryIcon(categoryName = '') {
  const name = categoryName.toLowerCase()
  if (/(song|music|playlist)/.test(name)) return '\u{1F3B5}'
  if (/(career|job|intern|interview|role|hire)/.test(name)) return '\u{1F4BC}'
  if (/(contest|challenge|hack|event)/.test(name)) return '\u{1F3C6}'
  if (/(personal|family|friend|life)/.test(name)) return '\u{1F33F}'
  if (/(finance|bank|invoice|bill|payment)/.test(name)) return '\u{1F4B3}'
  if (/(travel|trip|flight|booking)/.test(name)) return '\u{2708}'
  if (/(study|course|class|exam)/.test(name)) return '\u{1F4DA}'
  return '\u{2726}'
}

function buildSignalChips(email, category) {
  const chips = []
  if (email.category) chips.push(`Learns from ${email.category}`)
  if (email.confidence) chips.push(`${Math.round(email.confidence * 100)}% confidence`)

  const domain = getSenderDomain(email.from)
  if (domain) chips.push(domain)

  if (category?.autoClassifyEnabled) {
    chips.push('Auto mode enabled')
  } else if (category?.examplesNeeded) {
    chips.push(`${category.examplesNeeded} more examples needed`)
  }

  return chips.slice(0, 4)
}

function scoreRelatedEmail(baseEmail, candidate) {
  let score = 34
  if (baseEmail.category && candidate.category === baseEmail.category) score += 24
  if (getSenderAddress(baseEmail.from) === getSenderAddress(candidate.from)) score += 20
  if (getSenderDomain(baseEmail.from) === getSenderDomain(candidate.from)) score += 10

  const baseTokens = normalizeText(`${baseEmail.subject} ${getBodySnippet(baseEmail.body, 120)}`)
    .split(' ')
    .filter((token) => token.length > 3)
  const candidateText = normalizeText(`${candidate.subject} ${candidate.body}`)
  const overlap = baseTokens.reduce((count, token) => (candidateText.includes(token) ? count + 1 : count), 0)

  score += Math.min(overlap * 4, 18)
  if (candidate.confidence) score += Math.round(candidate.confidence * 8)

  return Math.max(42, Math.min(98, score))
}

function InsightCard({ icon: Icon, label, value, subtitle, note, progress, spark }) {
  const peak = Math.max(...spark, 1)
  const radius = 22
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (Math.max(progress, 0.02) * circumference)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.02 }}
      transition={{ duration: 0.2, type: 'spring', stiffness: 400, damping: 30 }}
      className="premium-glass relative flex h-full flex-col rounded-[28px] p-8"
    >
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2 text-[13px] font-medium tracking-wide text-[#707070]">
            <Icon className="h-4 w-4 opacity-70" strokeWidth={2.5} />
            {label}
          </div>
          <div className="mt-3 text-[36px] font-semibold leading-none tracking-tight text-[#111111]">
            {value}
          </div>
          <p className="mt-2 text-[14px] font-medium text-[#707070]">{subtitle}</p>
        </div>

        <div className="relative flex h-[52px] w-[52px] shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="4" />
            <circle
              cx="26"
              cy="26"
              r={radius}
              fill="none"
              stroke="#000000"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <span className="absolute text-[11px] font-bold text-[#111111]">
            {Math.round(progress * 100)}%
          </span>
        </div>
      </div>

      <div className="mt-auto pt-8 flex shrink-0 flex-col gap-4">
        <div className="flex h-[24px] items-end gap-1">
          {spark.map((point, index) => (
            <motion.span
              key={`${label}-${index}`}
              initial={{ height: 4, opacity: 0 }}
              animate={{ height: `${Math.max(4, Math.round((point / peak) * 24))}px`, opacity: 1 }}
              transition={{ duration: 0.2, delay: index * 0.04 }}
              className="w-1 rounded-full bg-[#111111] opacity-20"
            />
          ))}
        </div>
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#707070]">
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#000000] opacity-30" />
          <span className="leading-snug">{note}</span>
        </div>
      </div>
    </motion.div>
  )
}

function AnalyticsView({ analyticsData, categories, categoryStyles, totalEmails, needsReviewCount }) {
  const leadingCategories = [...categories].sort((left, right) => right.count - left.count).slice(0, 5)
  const peakVolume = Math.max(...analyticsData.map((row) => row.total), 1)
  const reviewPressure = totalEmails ? Math.round(needsReviewCount / totalEmails * 100) : 0

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_360px]"
    >
      <div className="glass-panel-strong rounded-[34px] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Analytics</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Inbox activity moved off the main workflow</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              The dashboard now keeps email review front and center. This space tracks volume and category momentum without stealing attention from the inbox.
            </p>
          </div>
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-right">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Peak day</div>
            <div className="mt-1 text-lg font-semibold text-white">{peakVolume} emails</div>
          </div>
        </div>

        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={analyticsData} margin={{ top: 12, right: 12, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="analytics-total" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6C63FF" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analytics-review" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="analytics-auto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeWidth: 1 }}
                contentStyle={{
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(9, 13, 27, 0.94)',
                  color: '#F8FAFC',
                  boxShadow: '0 22px 50px rgba(2, 6, 23, 0.55)',
                }}
              />
              <Area type="monotone" dataKey="total" stroke="#6C63FF" strokeWidth={3} fill="url(#analytics-total)" />
              <Area type="monotone" dataKey="review" stroke="#F59E0B" strokeWidth={2.2} fill="url(#analytics-review)" />
              <Area type="monotone" dataKey="auto" stroke="#34D399" strokeWidth={2.2} fill="url(#analytics-auto)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="glass-panel rounded-[30px] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Review pressure</p>
          <div className="mt-3 text-4xl font-semibold tracking-[-0.05em] text-white">{reviewPressure}%</div>
          <p className="mt-2 text-sm text-slate-300">
            of the inbox still needs a human decision before the model can quietly route it on its own.
          </p>
        </div>

        <div className="glass-panel rounded-[30px] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Category velocity</p>
              <h3 className="mt-2 text-lg font-semibold text-white">Where the model is learning fastest</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-slate-300">
              Top 5
            </span>
          </div>

          <div className="mt-5 space-y-4">
            {leadingCategories.length === 0 ? (
              <p className="rounded-[22px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                Add a few categories and label examples to unlock analytics.
              </p>
            ) : (
              leadingCategories.map((category) => {
                const style = categoryStyles[category.name]
                const progress = Math.min(100, Math.round(category.count / 15 * 100))

                return (
                  <div key={category.name} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getCategoryIcon(category.name)}</span>
                        <div>
                          <div className="font-medium text-white">{category.name}</div>
                          <div className="text-xs text-slate-400">{category.count} training examples</div>
                        </div>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: style?.accent || '#6C63FF' }}>
                        {progress}%
                      </span>
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${style?.accent || '#6C63FF'}, ${hexToRgba(style?.accent || '#6C63FF', 0.5)})` }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default function DashboardPage({ userEmail, onLogout }) {
  const [categories, setCategories] = useState([])
  const [emails, setEmails] = useState([])
  const [newCat, setNewCat] = useState('')
  const [tab, setTab] = useState('review')
  const [selectedEmailId, setSelectedEmailId] = useState(null)
  const [actionId, setActionId] = useState(null)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [activeNav, setActiveNav] = useState('review')
  const [searchQuery, setSearchQuery] = useState('')

  const deferredSearch = useDeferredValue(searchQuery)
  const categoriesRef = useRef(null)
  const searchInputRef = useRef(null)

  const fetchData = useCallback(async () => {
    setError('')
    try {
      const [categoryResponse, emailResponse] = await Promise.all([
        fetch(`${API}/categories?userEmail=${encodeURIComponent(userEmail)}`),
        fetch(`${API}/classify/emails?userEmail=${encodeURIComponent(userEmail)}`),
      ])

      const categoryData = await categoryResponse.json()
      const emailData = await emailResponse.json()

      setCategories(categoryData.categories || [])
      setEmails(emailData.emails || [])
    } catch (requestError) {
      setError(requestError.message)
    }
  }, [userEmail])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleAddCategory = async (event) => {
    event.preventDefault()
    const name = newCat.trim()
    if (!name) return

    setAdding(true)
    try {
      const response = await fetch(`${API}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error)
      }

      setNewCat('')
      await fetchData()
    } catch (requestError) {
      setError(requestError.message)
    }

    setAdding(false)
  }

  const handleDeleteCategory = async (name) => {
    if (!window.confirm(`Delete "${name}"?`)) return

    try {
      await fetch(`${API}/categories/${encodeURIComponent(name)}?userEmail=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      })
      await fetchData()
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const handleLabel = async (emailId, category) => {
    setActionId(emailId)
    try {
      await fetch(`${API}/classify/label`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, emailId, category }),
      })
      await fetchData()
    } catch (requestError) {
      setError(requestError.message)
    }
    setActionId(null)
  }

  const handleFeedback = async (emailId, predictedCategory, correctCategory) => {
    setActionId(emailId)
    try {
      await fetch(`${API}/classify/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail, emailId, predictedCategory, correctCategory }),
      })
      await fetchData()
    } catch (requestError) {
      setError(requestError.message)
    }
    setActionId(null)
  }

  const categoryLookup = useMemo(
    () => new Map(categories.map((category) => [category.name, category])),
    [categories],
  )

  const categoryStyles = useMemo(() => {
    const styles = {}

    categories.forEach((category, index) => {
      const accent = CATEGORY_TINTS[index % CATEGORY_TINTS.length]
      styles[category.name] = {
        accent,
        bg: hexToRgba(accent, 0.16),
        border: hexToRgba(accent, 0.34),
        muted: hexToRgba(accent, 0.1),
      }
    })

    return styles
  }, [categories])

  const classifiedEmails = useMemo(
    () => emails.filter((email) => email.category && !email.needsReview),
    [emails],
  )

  const autoClassifiedPercent = emails.length
    ? Math.round((classifiedEmails.length / emails.length) * 100)
    : 0

  const avgConfidence = classifiedEmails.filter((email) => email.confidence).length
    ? Math.round(
        classifiedEmails
          .filter((email) => email.confidence)
          .reduce((sum, email) => sum + email.confidence, 0) /
          classifiedEmails.filter((email) => email.confidence).length * 100,
      )
    : 0

  const needsReviewCount = emails.filter((email) => email.needsReview || !email.category).length
  const liveCategoriesCount = categories.filter((category) => category.autoClassifyEnabled).length
  const modelCoverage = categories.length ? Math.round((liveCategoriesCount / categories.length) * 100) : 0
  const todayKey = getDayKey(new Date())
  const todayCount = emails.filter((email) => getDayKey(email.createdAt) === todayKey).length
  const leadingCategory = [...categories].sort((left, right) => right.count - left.count)[0]

  const queryTokens = useMemo(
    () => normalizeText(deferredSearch).split(' ').filter(Boolean),
    [deferredSearch],
  )

  const filteredEmails = useMemo(() => {
    return emails.filter((email) => {
      const matchesTab = tab === 'review'
        ? email.needsReview || !email.category
        : tab === 'classified'
          ? email.category && !email.needsReview
          : true

      if (!matchesTab) return false
      if (queryTokens.length === 0) return true

      const linkedCategory = email.category ? categoryLookup.get(email.category) : null
      const haystack = normalizeText(
        [
          email.subject,
          email.from,
          email.body,
          email.category,
          email.classifyReasoning,
          linkedCategory?.summary,
        ]
          .filter(Boolean)
          .join(' '),
      )

      return queryTokens.every((token) => haystack.includes(token))
    })
  }, [emails, tab, queryTokens, categoryLookup])

  const filteredCategories = useMemo(() => {
    if (queryTokens.length === 0) return categories

    return categories.filter((category) => {
      const haystack = normalizeText(
        [
          category.name,
          category.summary,
          category.autoClassifyEnabled ? 'auto enabled' : 'needs examples',
        ]
          .filter(Boolean)
          .join(' '),
      )

      return queryTokens.every((token) => haystack.includes(token)) ||
        filteredEmails.some((email) => email.category === category.name)
    })
  }, [categories, filteredEmails, queryTokens])

  useEffect(() => {
    if (filteredEmails.length === 0) {
      setSelectedEmailId(null)
      return
    }

    if (!filteredEmails.some((email) => email.messageId === selectedEmailId)) {
      setSelectedEmailId(filteredEmails[0].messageId)
    }
  }, [filteredEmails, selectedEmailId])

  const selectedEmail = useMemo(
    () => filteredEmails.find((email) => email.messageId === selectedEmailId) || filteredEmails[0] || null,
    [filteredEmails, selectedEmailId],
  )

  const selectedCategory = selectedEmail?.category ? categoryLookup.get(selectedEmail.category) : null
  const selectedCategoryStyle = selectedEmail?.category
    ? categoryStyles[selectedEmail.category]
    : { accent: '#6C63FF', bg: hexToRgba('#6C63FF', 0.16), border: hexToRgba('#6C63FF', 0.34), muted: hexToRgba('#6C63FF', 0.1) }

  const relatedEmails = useMemo(() => {
    if (!selectedEmail) return []

    return emails
      .filter((email) => email.messageId !== selectedEmail.messageId)
      .filter((email) => {
        return (
          (selectedEmail.category && email.category === selectedEmail.category) ||
          getSenderDomain(email.from) === getSenderDomain(selectedEmail.from)
        )
      })
      .map((email) => ({
        ...email,
        similarity: scoreRelatedEmail(selectedEmail, email),
      }))
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, 3)
  }, [emails, selectedEmail])

  const analyticsData = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - index))

      return {
        key: getDayKey(date),
        day: new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date),
      }
    })

    return days.map(({ key, day }) => {
      const dayEmails = emails.filter((email) => getDayKey(email.createdAt) === key)
      const confidentEmails = dayEmails.filter((email) => email.confidence)

      return {
        day,
        total: dayEmails.length,
        review: dayEmails.filter((email) => email.needsReview || !email.category).length,
        auto: dayEmails.filter((email) => email.category && !email.needsReview).length,
        avgConfidence: confidentEmails.length
          ? Math.round(confidentEmails.reduce((sum, email) => sum + email.confidence, 0) / confidentEmails.length * 100)
          : 0,
      }
    })
  }, [emails])

  const overviewCards = [
    {
      icon: FiAlertCircle,
      label: 'Needs Review',
      value: needsReviewCount,
      subtitle: needsReviewCount > 0 ? 'Priority queue waiting on a human' : 'Nothing needs manual review right now',
      note: needsReviewCount > 0 ? `${Math.round((needsReviewCount / Math.max(emails.length, 1)) * 100)}% of inbox needs attention` : 'The queue is clear',
      progress: Math.min(1, needsReviewCount / Math.max(emails.length, 1)),
      spark: analyticsData.map((row) => row.review || 0),
      tone: 'amber',
    },
    {
      icon: FiZap,
      label: 'Auto Sorted',
      value: `${autoClassifiedPercent}%`,
      subtitle: `${classifiedEmails.length} emails routed without interruption`,
      note: `${todayCount} new messages arrived today`,
      progress: autoClassifiedPercent / 100,
      spark: analyticsData.map((row) => row.auto || 0),
      tone: 'violet',
    },
    {
      icon: FiLayers,
      label: 'Live Categories',
      value: liveCategoriesCount,
      subtitle: `${categories.length} total classification lanes`,
      note: leadingCategory ? `${leadingCategory.name} is learning fastest` : 'Create your first category to start training',
      progress: modelCoverage / 100,
      spark: categories.slice(0, 6).map((category) => category.count || 0),
      tone: 'cyan',
    },
    {
      icon: FiTrendingUp,
      label: 'Avg Confidence',
      value: `${avgConfidence}%`,
      subtitle: 'Across accepted AI predictions',
      note: selectedCategory?.summary ? 'Category summaries are ready for review' : 'Confidence rises as labeled examples grow',
      progress: avgConfidence / 100,
      spark: analyticsData.map((row) => row.avgConfidence || 0),
      tone: 'emerald',
    },
  ]

  const signalChips = selectedEmail ? buildSignalChips(selectedEmail, selectedCategory) : []
  const previewReasoning = selectedEmail?.classifyReasoning || (
    selectedEmail
      ? `The model is leaning on sender patterns, message phrasing, and the training examples already collected for ${selectedEmail.category || 'your open categories'}. As you confirm or correct this message, the next prediction becomes more certain.`
      : ''
  )

  const handleTabChange = (nextTab) => {
    setTab(nextTab)
    setActiveNav(nextTab === 'review' ? 'review' : 'inbox')
  }

  const handleNavSelect = (navId) => {
    setActiveNav(navId)

    if (navId === 'review') {
      setTab('review')
      return
    }

    if (navId === 'inbox') {
      setTab('all')
      return
    }

    if (navId === 'categories') {
      requestAnimationFrame(() => {
        categoriesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  const userInitial = userEmail?.[0]?.toUpperCase() || 'U'
  const userName = userEmail?.split('@')[0] || 'User'

  const headerTitle = activeNav === 'analytics'
    ? 'Analytics workspace'
    : activeNav === 'review'
      ? 'Review workspace'
      : activeNav === 'categories'
        ? 'Category command center'
        : 'Inbox command center'

  const headerSubtitle = activeNav === 'analytics'
    ? 'Secondary insights live here so the inbox can stay primary.'
    : 'AI predictions, category training, and email review now sit in one clear workflow.'

  const shortDate = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <div className="app-shell min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <Sidebar
        activeNav={activeNav}
        onNavSelect={handleNavSelect}
        userEmail={userEmail}
        userName={userName}
        userInitial={userInitial}
        onLogout={onLogout}
      />

      <div className="main-content-wrapper">
        <TopNav
          title={headerTitle}
          subtitle={headerSubtitle}
          searchQuery={searchQuery}
          onSearchChange={(event) => setSearchQuery(event.target.value)}
          searchInputRef={searchInputRef}
          onRefresh={fetchData}
          needsReviewCount={needsReviewCount}
          metaDate={formatLongDate(new Date())}
          shortDate={shortDate}
          visibleEmailsCount={filteredEmails.length}
          liveCategoriesCount={liveCategoriesCount}
        />

        {error && (
          <div className="px-6 pt-4">
            <div className="rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        )}

        <main className="flex-1 px-6 pb-8 pt-6">
          <div className="grid gap-5">
            {activeNav !== 'analytics' && (
              <>
                <section className="grid gap-6 xl:grid-cols-4">
                  {overviewCards.map((card) => (
                    <InsightCard key={card.label} {...card} />
                  ))}
                </section>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)] xl:items-start">
                  <EmailList
                    emails={filteredEmails}
                    counts={{
                      review: needsReviewCount,
                      classified: classifiedEmails.length,
                      all: emails.length,
                    }}
                    categories={categories}
                    categoryStyles={categoryStyles}
                    tab={tab}
                    onTabChange={handleTabChange}
                    selectedEmailId={selectedEmailId}
                    onSelectEmail={setSelectedEmailId}
                    actionId={actionId}
                    onLabel={handleLabel}
                    onFeedback={handleFeedback}
                    onRefresh={fetchData}
                    searchQuery={deferredSearch}
                  />

                  <motion.aside
                    ref={categoriesRef}
                    initial={{ opacity: 0, x: 14 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="premium-glass rounded-[28px] p-8 xl:sticky xl:top-[118px] flex flex-col max-h-[calc(100vh-140px)]"
                  >
                    <div className="flex items-start justify-between gap-4 shrink-0">
                      <div>
                        <h2 className="text-[28px] font-semibold tracking-tight text-[#111111]">Categories</h2>
                        <p className="mt-1 text-[16px] text-[#707070]">
                          Manage AI classification lanes and training progress.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#F5F5F3] border border-[#E4E4E7] px-3 py-1 text-[13px] font-medium text-[#111111]">
                        {filteredCategories.length} lanes
                      </span>
                    </div>

                    <form onSubmit={handleAddCategory} className="mt-6 flex items-center gap-3 shrink-0">
                      <div className="flex flex-1 items-center gap-3 rounded-[20px] bg-[#F5F5F3] px-4 py-3 border border-transparent focus-within:bg-white focus-within:shadow-sm focus-within:border-[rgba(0,0,0,0.1)] transition-all">
                        <FiSearch className="h-[18px] w-[18px] text-[#A1A1AA]" />
                        <input
                          value={newCat}
                          onChange={(event) => setNewCat(event.target.value)}
                          placeholder="Create a new category"
                          className="w-full bg-transparent text-[15px] text-[#111111] placeholder:text-[#A1A1AA] outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={adding || !newCat.trim()}
                        className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[18px] bg-[#111111] text-white shadow-sm transition-transform hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                      >
                        {adding ? (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                          <FiPlus className="h-5 w-5" />
                        )}
                      </button>
                    </form>

                    <div className="scrollbar-thin mt-6 space-y-4 overflow-y-auto pr-2 pb-4">
                      {filteredCategories.length === 0 ? (
                        <div className="rounded-[24px] border border-dashed border-[#E4E4E7] bg-[#F5F5F3] px-4 py-8 text-center text-[14px] text-[#707070]">
                          No categories match this search yet.
                        </div>
                      ) : (
                        filteredCategories.map((category) => {
                          const progress = Math.min(100, Math.round((category.count / 15) * 100))

                          return (
                            <motion.article
                              key={category.name}
                              initial={{ opacity: 0, y: 14 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileHover={{ scale: 1.01 }}
                              className="rounded-[24px] bg-white border border-[rgba(0,0,0,0.06)] p-5 transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4">
                                  <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-[16px] bg-[#F5F5F3] text-[20px] text-[#111111]">
                                    {getCategoryIcon(category.name)}
                                  </div>

                                  <div>
                                    <div className="flex items-center gap-3">
                                      <h3 className="text-[16px] font-semibold text-[#111111]">{category.name}</h3>
                                      <span className="text-[13px] font-medium text-[#A1A1AA]">{category.count} / 15</span>
                                    </div>
                                    <p className="mt-1.5 text-[14px] leading-relaxed text-[#707070] line-clamp-2">
                                      {getCompactCopy(category.summary, 170) || 'Summary will appear here as labeled examples accumulate.'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2">
                                  <span className="rounded-full bg-[#F5F5F3] border border-[#E4E4E7] px-3 py-1.5 text-[12px] font-medium text-[#111111] whitespace-nowrap">
                                    {category.autoClassifyEnabled ? 'Auto on' : `Needs ${category.examplesNeeded}`}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCategory(category.name)}
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#A1A1AA] transition-colors hover:bg-red-50 hover:text-red-500"
                                    title={`Delete ${category.name}`}
                                  >
                                    <FiTrash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              <div className="mt-5 h-[6px] w-full overflow-hidden rounded-full bg-[#F5F5F3]">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.55 }}
                                  className="h-full rounded-full bg-[#111111]"
                                />
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[13px] font-medium">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-full bg-[#F5F5F3] px-3 py-1 text-[#707070]">
                                    {category.autoClassifyEnabled ? 'AI summary ready' : `${category.examplesNeeded} more examples`}
                                  </span>
                                  {category.pendingCount > 0 && (
                                    <span className="rounded-full bg-[#FFFBEB] px-3 py-1 text-[#D97706]">
                                      {category.pendingCount} waiting
                                    </span>
                                  )}
                                </div>
                                <button className="flex items-center gap-1 text-[#111111] hover:opacity-70 transition-opacity">
                                  Review lane <FiChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </motion.article>
                          )
                        })
                      )}
                    </div>
                  </motion.aside>
                </section>

                <section className="premium-glass rounded-[28px] p-8 lg:p-12">
                  <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-[28px] font-semibold tracking-tight text-[#111111]">AI review workspace</h2>
                      <p className="mt-2 max-w-2xl text-[16px] text-[#707070]">
                        Read the email, inspect the model's reasoning, and correct predictions.
                      </p>
                    </div>
                    <div className="rounded-full bg-[#F5F5F3] border border-[#E4E4E7] px-4 py-2 text-[14px] font-medium text-[#707070]">
                      {selectedEmail ? `Focused on ${getSenderName(selectedEmail.from)}` : 'Pick an email to inspect'}
                    </div>
                  </div>

                  {!selectedEmail ? (
                    <div className="rounded-[24px] border border-dashed border-[#E4E4E7] bg-white px-6 py-20 text-center text-[15px] text-[#707070]">
                      Search results are empty right now. Clear the search or switch tabs to load a preview.
                    </div>
                  ) : (
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={selectedEmail.messageId}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid gap-8 xl:grid-cols-[minmax(0,1.3fr)_380px]"
                      >
                        {/* LEFT COLUMN: Notion-like Document */}
                        <div className="flex flex-col gap-8 rounded-[24px] bg-white border border-[rgba(0,0,0,0.06)] p-8 shadow-sm">
                          {/* Sender & Subject Header */}
                          <div>
                            <div className="mb-6 flex items-center gap-3">
                              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#F5F5F3] text-[18px] font-bold text-[#111111]">
                                {getSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[15px] font-semibold text-[#111111]">{getSenderName(selectedEmail.from)}</div>
                                <div className="truncate text-[13px] text-[#707070]">{getSenderAddress(selectedEmail.from)}</div>
                              </div>
                            </div>

                            <h3 className="text-[32px] font-bold leading-tight tracking-tight text-[#111111]">
                              {selectedEmail.subject || '(no subject)'}
                            </h3>

                            <div className="mt-4 flex flex-wrap items-center gap-2 text-[13px] text-[#707070]">
                              <span className="flex items-center gap-1.5 font-medium">
                                <FiClock className="h-4 w-4" />
                                {formatLongDate(selectedEmail.createdAt)}
                              </span>
                              {selectedEmail.category && (
                                <span className="rounded-full border border-[#E4E4E7] bg-white px-3 py-1 font-medium text-[#111111]">
                                  {selectedEmail.category}
                                </span>
                              )}
                              <span className="rounded-full bg-[#F5F5F3] px-3 py-1 font-medium text-[#707070]">
                                {selectedEmail.needsReview || !selectedEmail.category ? 'Needs human approval' : 'Auto-classified'}
                              </span>
                            </div>
                          </div>

                          {/* Summary Box */}
                          <div className="rounded-[16px] border border-[#E4E4E7] bg-[#F5F5F3] p-5">
                            <p className="text-[12px] font-bold uppercase tracking-widest text-[#707070]">Summary</p>
                            <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#111111]">{getEmailSummary(selectedEmail.body)}</p>
                          </div>

                          {/* Message Body */}
                          <div>
                            <p className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#707070]">Message body</p>
                            <div className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[#111111]">
                              <p className="mail-preview-body max-h-[400px] overflow-y-auto whitespace-pre-wrap pr-4">
                                {selectedEmail.body || 'No content available.'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* RIGHT COLUMN: AI Insights & Actions */}
                        <div className="space-y-6">
                          {/* AI Reasoning */}
                          <div className="rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-4">
                              <p className="text-[12px] font-bold uppercase tracking-widest text-[#707070]">AI Reasoning</p>
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E4E4E7] bg-[#F5F5F3] text-[13px] font-bold text-[#111111]">
                                {Math.round((selectedEmail.confidence || 0) * 100)}%
                              </div>
                            </div>
                            
                            <p className="text-[14px] leading-relaxed text-[#707070]">{previewReasoning}</p>

                            <div className="mt-5 flex flex-wrap gap-2">
                              {signalChips.map((chip) => (
                                <span
                                  key={chip}
                                  className="rounded-full bg-[#F5F5F3] px-3 py-1.5 text-[12px] font-medium text-[#707070]"
                                >
                                  {chip}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Actions / Predictions */}
                          <div className="rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
                            <p className="mb-4 text-[12px] font-bold uppercase tracking-widest text-[#707070]">Prediction & Action</p>
                            <div className="text-[24px] font-bold tracking-tight text-[#111111]">
                              {selectedEmail.category || 'Awaiting category'}
                            </div>
                            <p className="mt-2 text-[14px] leading-relaxed text-[#707070]">
                              {selectedEmail.category
                                ? selectedEmail.needsReview
                                  ? 'The model wants a human check before moving on.'
                                  : 'The message was confidently sorted.'
                                : 'This message needs a category so the model can learn.'}
                            </p>

                            <div className="mt-6">
                              {actionId === selectedEmail.messageId ? (
                                <div className="flex items-center gap-3 rounded-[16px] border border-[#E4E4E7] bg-white px-4 py-4 text-[14px] font-medium text-[#707070]">
                                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#111111] border-t-transparent" />
                                  Updating classifier...
                                </div>
                              ) : categories.length === 0 ? (
                                <div className="rounded-[16px] border border-dashed border-[#E4E4E7] bg-[#F5F5F3] px-4 py-5 text-[14px] text-[#707070]">
                                  Add a category first to train the model.
                                </div>
                              ) : (
                                <div className="space-y-5">
                                  {selectedEmail.category && selectedEmail.needsReview && (
                                    <button
                                      type="button"
                                      onClick={() => handleFeedback(selectedEmail.messageId, selectedEmail.category, selectedEmail.category)}
                                      className="flex w-full items-center justify-center rounded-[16px] bg-[#111111] px-4 py-3.5 text-[15px] font-medium text-white shadow-sm transition hover:bg-black/80"
                                    >
                                      <FiCheckCircle className="mr-2 h-[18px] w-[18px]" />
                                      Accept prediction
                                    </button>
                                  )}

                                  <div>
                                    <div className="mb-3 text-[12px] font-bold uppercase tracking-widest text-[#707070]">
                                      {selectedEmail.category ? 'Move category' : 'Train with category'}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {categories.map((category) => {
                                        const isActive = selectedEmail.category === category.name

                                        return (
                                          <button
                                            key={category.name}
                                            type="button"
                                            onClick={() => {
                                              if (selectedEmail.category) {
                                                handleFeedback(selectedEmail.messageId, selectedEmail.category, category.name)
                                              } else {
                                                handleLabel(selectedEmail.messageId, category.name)
                                              }
                                            }}
                                            className={`rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                                              isActive ? 'bg-[#111111] text-white shadow-sm' : 'border border-[#E4E4E7] bg-white text-[#707070] hover:bg-[#F5F5F3] hover:text-[#111111]'
                                            }`}
                                          >
                                            {category.name}
                                          </button>
                                        )
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Related Inbox Matches */}
                          <div className="rounded-[24px] border border-[rgba(0,0,0,0.06)] bg-white p-6 shadow-sm">
                            <div className="mb-5 flex items-center justify-between gap-4">
                              <p className="text-[12px] font-bold uppercase tracking-widest text-[#707070]">Related matches</p>
                              <span className="rounded-full bg-[#F5F5F3] px-3 py-1 text-[12px] font-medium text-[#707070]">
                                {relatedEmails.length} found
                              </span>
                            </div>

                            <div className="space-y-4">
                              {relatedEmails.length === 0 ? (
                                <div className="rounded-[16px] border border-dashed border-[#E4E4E7] bg-[#F5F5F3] px-4 py-5 text-[13px] text-[#707070]">
                                  No supporting patterns found yet.
                                </div>
                              ) : (
                                relatedEmails.map((email) => (
                                  <div
                                    key={email.messageId}
                                    className="rounded-[16px] border border-[#E4E4E7] bg-[#FAFAFA] p-4"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="truncate text-[14px] font-semibold text-[#111111]">{email.subject || '(no subject)'}</div>
                                        <div className="mt-0.5 text-[13px] text-[#707070]">{getSenderName(email.from)}</div>
                                      </div>
                                      <span className="shrink-0 rounded-full bg-[#F5F5F3] px-2.5 py-1 text-[11px] font-medium text-[#707070]">
                                        {email.similarity}%
                                      </span>
                                    </div>
                                    <p className="mt-3 line-clamp-2 text-[13px] leading-relaxed text-[#707070]">{getBodySnippet(email.body, 130)}</p>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  )}
                </section>
              </>
            )}

            {activeNav === 'analytics' && (
              <AnalyticsView
                analyticsData={analyticsData}
                categories={categories}
                categoryStyles={categoryStyles}
                totalEmails={emails.length}
                needsReviewCount={needsReviewCount}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
