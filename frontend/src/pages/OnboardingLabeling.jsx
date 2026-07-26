import { useState, useRef, useEffect } from 'react'
import { animate } from 'animejs'

export default function OnboardingLabeling() {
    const [userEmail, setUserEmail] = useState('')
    const [emails, setEmails] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [progress, setProgress] = useState({ labeled: 0, total: 0, complete: false })
    const [phase, setPhase] = useState('input') // 'input' | 'labeling' | 'complete'
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const cardRef = useRef(null)
    const progressBarRef = useRef(null)

    // ── Load sample emails ──────────────────────────────────────────
    const handleLoadSample = async () => {
        if (!userEmail.trim()) {
            setError('Please enter your email address')
            return
        }

        setLoading(true)
        setError('')

        try {
            const res = await fetch(`/api/onboarding/sample?userEmail=${encodeURIComponent(userEmail)}`)
            const data = await res.json()

            if (!res.ok) throw new Error(data.error || 'Failed to load emails')

            if (!data.emails || data.emails.length === 0) {
                setError('No emails found for this account. Make sure your emails have been synced first.')
                return
            }

            setEmails(data.emails)

            // Check existing progress to resume where user left off
            const progressRes = await fetch(`/api/onboarding/progress?userEmail=${encodeURIComponent(userEmail)}`)
            const progressData = await progressRes.json()
            setProgress(progressData)

            if (progressData.complete) {
                setPhase('complete')
            } else {
                // Find first unlabeled email
                const labeledRes = await fetch(`/api/onboarding/progress?userEmail=${encodeURIComponent(userEmail)}`)
                const labeledData = await labeledRes.json()

                // Skip already-labeled emails by starting at the labeled count
                setCurrentIndex(labeledData.labeled)
                setPhase('labeling')
            }

        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // ── Animate card entrance ───────────────────────────────────────
    useEffect(() => {
        if (phase === 'labeling' && cardRef.current) {
            animate(cardRef.current, {
                opacity: [0, 1],
                translateX: [60, 0],
                duration: 400,
                ease: 'outCubic'
            })
        }
    }, [currentIndex, phase])

    // ── Animate progress bar ────────────────────────────────────────
    useEffect(() => {
        if (progressBarRef.current && progress.total > 0) {
            const pct = (progress.labeled / progress.total) * 100
            animate(progressBarRef.current, {
                width: `${pct}%`,
                duration: 500,
                ease: 'outQuart'
            })
        }
    }, [progress])

    // ── Label an email ──────────────────────────────────────────────
    const handleLabel = async (label) => {
        const email = emails[currentIndex]
        if (!email) return

        try {
            const res = await fetch('/api/onboarding/label', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail,
                    emailId: email.emailId,
                    label
                })
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to save label')
            }

            const newProgress = {
                ...progress,
                labeled: progress.labeled + 1,
                complete: progress.labeled + 1 >= progress.total
            }
            setProgress(newProgress)

            // Animate card exit then advance
            if (cardRef.current) {
                await animate(cardRef.current, {
                    opacity: [1, 0],
                    translateX: [0, -80],
                    duration: 250,
                    ease: 'inCubic'
                }).finished
            }

            if (currentIndex + 1 >= emails.length || newProgress.complete) {
                setPhase('complete')
            } else {
                setCurrentIndex(prev => prev + 1)
            }

        } catch (err) {
            setError(err.message)
        }
    }

    // ── Skip remaining ──────────────────────────────────────────────
    const handleSkipRemaining = async () => {
        try {
            const res = await fetch('/api/onboarding/skip-remaining', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail })
            })

            if (!res.ok) throw new Error('Failed to skip remaining')

            setProgress(prev => ({ ...prev, labeled: prev.total, complete: true }))
            setPhase('complete')

        } catch (err) {
            setError(err.message)
        }
    }

    // ── Format date ─────────────────────────────────────────────────
    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric'
            })
        } catch { return '' }
    }

    // ── Render: Input Phase ─────────────────────────────────────────
    if (phase === 'input') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 mb-5">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                            Teach Your Inbox
                        </h1>
                        <p className="text-gray-400 text-base leading-relaxed">
                            We'll show you a sample of your emails. Mark which ones matter to you —
                            it only takes a few minutes.
                        </p>
                    </div>

                    {/* Email Input */}
                    <div className="mb-6">
                        <label className="block text-sm text-gray-400 mb-2 font-medium">Your synced email</label>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLoadSample()}
                            placeholder="you@example.com"
                            className="w-full bg-gray-800/60 border border-gray-700/80 rounded-xl px-4 py-3.5 text-base focus:outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/20 transition-all placeholder:text-gray-600"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Start Button */}
                    <button
                        onClick={handleLoadSample}
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Loading...
                            </span>
                        ) : (
                            'Start Labeling'
                        )}
                    </button>
                </div>
            </div>
        )
    }

    // ── Render: Labeling Phase ───────────────────────────────────────
    if (phase === 'labeling') {
        const currentEmail = emails[currentIndex]
        const pct = progress.total > 0 ? Math.round((progress.labeled / progress.total) * 100) : 0

        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-lg">
                    {/* Progress Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-400">
                                {progress.labeled} of {progress.total} labeled
                            </span>
                            <span className="text-sm font-medium text-purple-400">{pct}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                ref={progressBarRef}
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-none"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>

                    {/* Email Card */}
                    {currentEmail && (
                        <div
                            ref={cardRef}
                            className="bg-gray-800/60 border border-gray-700/60 rounded-2xl p-6 mb-6 backdrop-blur-sm"
                        >
                            {/* Sender */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/20 flex items-center justify-center text-sm font-semibold text-purple-300">
                                    {(currentEmail.from || '?')[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-200 truncate">{currentEmail.from}</p>
                                    <p className="text-xs text-gray-500">{formatDate(currentEmail.date)}</p>
                                </div>
                            </div>

                            {/* Subject */}
                            <h2 className="text-lg font-semibold text-gray-100 mb-3 leading-snug">
                                {currentEmail.subject || '(No Subject)'}
                            </h2>

                            {/* Snippet */}
                            <p className="text-sm text-gray-400 leading-relaxed line-clamp-4">
                                {currentEmail.snippet || '(No preview available)'}
                            </p>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mb-6">
                        <button
                            onClick={() => handleLabel('not_important')}
                            className="flex-1 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer bg-gray-800 border border-gray-600/50 text-gray-300 hover:bg-gray-700 hover:border-gray-500 active:scale-[0.97]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-gray-500">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                Not Important
                            </span>
                        </button>
                        <button
                            onClick={() => handleLabel('important')}
                            className="flex-1 py-4 px-6 rounded-xl font-semibold text-base transition-all duration-200 cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 active:scale-[0.97]"
                        >
                            <span className="flex items-center justify-center gap-2">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Important
                            </span>
                        </button>
                    </div>

                    {/* Skip Remaining — always visible */}
                    <div className="text-center">
                        <button
                            onClick={handleSkipRemaining}
                            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer underline underline-offset-2 decoration-gray-700 hover:decoration-gray-500"
                        >
                            Skip the rest, I'm done for now
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // ── Render: Complete Phase ───────────────────────────────────────
    if (phase === 'complete') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-100 mb-3">
                        Your preferences are saved!
                    </h2>
                    <p className="text-gray-400 mb-2 leading-relaxed">
                        You labeled <span className="text-purple-400 font-semibold">{progress.labeled}</span> of {progress.total} emails.
                    </p>
                    <p className="text-gray-500 text-sm">
                        You can revisit this anytime to refine your preferences.
                    </p>
                </div>
            </div>
        )
    }

    return null
}
