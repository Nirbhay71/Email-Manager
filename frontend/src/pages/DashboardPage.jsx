import { useState, useEffect } from 'react'

export default function DashboardPage({ userEmail, onLogout }) {
    const [categories, setCategories] = useState([])
    const [emails, setEmails] = useState([])
    const [newCategoryName, setNewCategoryName] = useState('')
    const [activeTab, setActiveTab] = useState('review') // 'review', 'classified', 'all'
    const [expandedEmailId, setExpandedEmailId] = useState(null)
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [loadingEmails, setLoadingEmails] = useState(true)
    const [actionLoadingId, setActionLoadingId] = useState(null) // ID of email currently being processed
    const [addingCategory, setAddingCategory] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    const API_BASE = 'http://localhost:5000'

    // Fetch categories and emails
    const fetchData = async () => {
        try {
            setErrorMsg('')
            // Fetch categories
            const catRes = await fetch(`${API_BASE}/categories?userEmail=${encodeURIComponent(userEmail)}`)
            if (!catRes.ok) throw new Error('Failed to load categories')
            const catData = await catRes.json()
            setCategories(catData.categories || [])
            setLoadingCategories(false)

            // Fetch emails
            const emailRes = await fetch(`${API_BASE}/classify/emails?userEmail=${encodeURIComponent(userEmail)}`)
            if (!emailRes.ok) throw new Error('Failed to load emails')
            const emailData = await emailRes.json()
            setEmails(emailData.emails || [])
            setLoadingEmails(false)
        } catch (err) {
            console.error('Error fetching data:', err)
            setErrorMsg(err.message || 'Error loading dashboard data. Please verify backend is running on port 5000.')
            setLoadingCategories(false)
            setLoadingEmails(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [userEmail])

    // Add a new category
    const handleAddCategory = async (e) => {
        e.preventDefault()
        const name = newCategoryName.trim()
        if (!name) return

        setAddingCategory(true)
        setErrorMsg('')
        try {
            const res = await fetch(`${API_BASE}/categories`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, name }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to create category')
            }
            setNewCategoryName('')
            await fetchData()
        } catch (err) {
            setErrorMsg(err.message)
        } finally {
            setAddingCategory(false)
        }
    }

    // Delete a category
    const handleDeleteCategory = async (catName) => {
        if (!confirm(`Are you sure you want to delete the category "${catName}"? This won't delete the emails, but will remove this option from your schema.`)) return

        setErrorMsg('')
        try {
            const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(catName)}?userEmail=${encodeURIComponent(userEmail)}`, {
                method: 'DELETE',
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || 'Failed to delete category')
            }
            await fetchData()
        } catch (err) {
            setErrorMsg(err.message)
        }
    }

    // Label an email (initial onboarding/manual labeling)
    const handleLabelEmail = async (emailId, category) => {
        setActionLoadingId(emailId)
        setErrorMsg('')
        try {
            const res = await fetch(`${API_BASE}/classify/label`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userEmail, emailId, category }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to label email')
            await fetchData()
        } catch (err) {
            setErrorMsg(err.message)
        } finally {
            setActionLoadingId(null)
        }
    }

    // Record Feedback (confirm or correct AI prediction)
    const handleFeedback = async (emailId, predictedCategory, correctCategory) => {
        setActionLoadingId(emailId)
        setErrorMsg('')
        try {
            const res = await fetch(`${API_BASE}/classify/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail,
                    emailId,
                    predictedCategory,
                    correctCategory,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to submit feedback')
            await fetchData()
        } catch (err) {
            setErrorMsg(err.message)
        } finally {
            setActionLoadingId(null)
        }
    }

    // Filter emails based on the active tab
    const filteredEmails = emails.filter((email) => {
        if (activeTab === 'review') {
            return email.needsReview || !email.category
        } else if (activeTab === 'classified') {
            return email.category && !email.needsReview
        }
        return true // 'all'
    })

    const needsReviewCount = emails.filter(e => e.needsReview || !e.category).length

    return (
        <div className="min-h-screen w-full bg-[#FAFAFA] text-[#0F172A] flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900" style={{ fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <header className="bg-white border-b border-[#E2E8F0] sticky top-0 z-10 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                        <svg className="w-5.5 h-5.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-[#0F172A]">AI Email Manager</h1>
                        <p className="text-xs text-[#64748B] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            gRPC Classification Pipeline Active
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#F1F5F9] px-4 py-2 rounded-xl text-sm font-medium text-[#475569] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        {userEmail}
                    </div>
                    <button
                        onClick={onLogout}
                        className="text-sm font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-2 rounded-lg hover:bg-[#F1F5F9] transition-all cursor-pointer"
                    >
                        Sign Out
                    </button>
                </div>
            </header>

            {/* Error banner */}
            {errorMsg && (
                <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-6 py-3.5 text-sm font-medium flex items-center gap-3.5 animate-fadeIn">
                    <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{errorMsg}</span>
                </div>
            )}

            {/* Main Content Area */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Category Schema Manager */}
                <section className="lg:col-span-4 flex flex-col gap-6">
                    
                    {/* Add Category Card */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                        <h2 className="text-base font-bold text-[#0F172A] mb-1.5">Define Categories</h2>
                        <p className="text-xs text-[#64748B] mb-4">Add new label schemas you want to categorize your inbox by.</p>
                        
                        <form onSubmit={handleAddCategory} className="flex gap-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g. Bills, Work, Personal"
                                disabled={addingCategory}
                                className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder-[#94A3B8]"
                            />
                            <button
                                type="submit"
                                disabled={addingCategory || !newCategoryName.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-[#E2E8F0] disabled:text-[#94A3B8] text-white px-4 rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center shrink-0"
                            >
                                {addingCategory ? (
                                    <span className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></span>
                                ) : (
                                    <span>Add</span>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Category List & Status */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex-1 flex flex-col min-h-[350px]">
                        <h2 className="text-base font-bold text-[#0F172A] mb-1">Classifier Status</h2>
                        <p className="text-xs text-[#64748B] mb-5">Each category needs 15 labeled examples to go live with auto-classification.</p>

                        {loadingCategories ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-[#64748B] gap-2">
                                <span className="w-8 h-8 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></span>
                                <span className="text-xs font-semibold">Loading schemas...</span>
                            </div>
                        ) : categories.length === 0 ? (
                            <div className="flex-1 border-2 border-dashed border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center p-6 text-center text-[#64748B]">
                                <svg className="w-8 h-8 text-[#94A3B8] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="text-sm font-bold text-[#475569] mb-1">No Categories Yet</span>
                                <span className="text-xs max-w-[200px]">Define your first category using the input form above to begin.</span>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3.5 overflow-y-auto max-h-[500px] pr-1">
                                {categories.map((cat) => {
                                    const progress = Math.min((cat.count / 15) * 100, 100)
                                    return (
                                        <div key={cat.name} className="border border-[#F1F5F9] rounded-xl p-3.5 hover:border-[#E2E8F0] transition-all bg-slate-50/50">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <div>
                                                    <span className="font-bold text-sm text-[#1E293B]">{cat.name}</span>
                                                    <span className="text-[11px] text-[#64748B] block mt-0.5">{cat.count} labeled examples</span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteCategory(cat.name)}
                                                    className="text-[#94A3B8] hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                                    title="Delete Category"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mb-2">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${cat.autoClassifyEnabled ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                {cat.autoClassifyEnabled ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                        Auto-Classify Live
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                                        Cold Start ({15 - cat.count} more needed)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>

                {/* Right Column: Emails list, status, labeling and feedback panel */}
                <section className="lg:col-span-8 flex flex-col gap-6">
                    
                    {/* Tabs / Filter Navigation */}
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-wrap justify-between items-center gap-4">
                        <div className="flex bg-[#F1F5F9] p-1 rounded-xl gap-0.5">
                            <button
                                onClick={() => setActiveTab('review')}
                                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 ${
                                    activeTab === 'review' 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                            >
                                Needs Review
                                {needsReviewCount > 0 && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                                        {needsReviewCount}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('classified')}
                                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                                    activeTab === 'classified' 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                            >
                                Auto-Classified
                            </button>
                            <button
                                onClick={() => setActiveTab('all')}
                                className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
                                    activeTab === 'all' 
                                        ? 'bg-white text-indigo-600 shadow-sm' 
                                        : 'text-[#64748B] hover:text-[#0F172A]'
                                }`}
                            >
                                All Inbox
                            </button>
                        </div>

                        <button
                            onClick={fetchData}
                            className="p-2 bg-slate-50 border border-[#E2E8F0] hover:bg-slate-100 rounded-lg cursor-pointer text-[#64748B] hover:text-[#0F172A] transition-all"
                            title="Refresh Emails"
                        >
                            <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                            </svg>
                        </button>
                    </div>

                    {/* Email Inbox list */}
                    <div className="flex-1 flex flex-col min-h-[450px]">
                        {loadingEmails ? (
                            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center gap-2 p-12">
                                <span className="w-9 h-9 border-3 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></span>
                                <span className="text-xs font-semibold text-[#64748B]">Loading inbox messages...</span>
                            </div>
                        ) : filteredEmails.length === 0 ? (
                            <div className="flex-1 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center p-12 text-center text-[#64748B]">
                                <div className="w-16 h-16 bg-[#F1F5F9] rounded-2xl flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-[#94A3B8]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                    </svg>
                                </div>
                                <h3 className="text-base font-bold text-[#475569] mb-1">No Emails Found</h3>
                                <p className="text-xs max-w-[280px] leading-relaxed">
                                    {activeTab === 'review' 
                                        ? "All caught up! No emails require review or manual labeling at this time." 
                                        : activeTab === 'classified'
                                        ? "No auto-classified emails yet. Keep training categories by reviewing emails!"
                                        : "Your inbox is empty. Send a test email to trigger categorization!"}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredEmails.map((email) => {
                                    const isExpanded = expandedEmailId === email.messageId
                                    const dateStr = email.createdAt ? new Date(email.createdAt).toLocaleDateString(undefined, {
                                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    }) : ''
                                    const confidencePercent = email.confidence ? Math.round(email.confidence * 100) : 0

                                    return (
                                        <div 
                                            key={email.messageId} 
                                            className={`bg-white border rounded-2xl transition-all ${
                                                isExpanded 
                                                    ? 'border-indigo-200 shadow-md shadow-indigo-50/50' 
                                                    : email.needsReview 
                                                    ? 'border-[#E2E8F0] hover:border-amber-200 hover:shadow-sm' 
                                                    : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                                            }`}
                                        >
                                            
                                            {/* Summary row */}
                                            <div 
                                                onClick={() => setExpandedEmailId(isExpanded ? null : email.messageId)}
                                                className="p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 cursor-pointer select-none"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                        <span className="font-bold text-sm text-[#0F172A] truncate max-w-[200px]">{email.from}</span>
                                                        <span className="text-[10px] text-[#94A3B8]">•</span>
                                                        <span className="text-[11px] text-[#64748B] font-medium">{dateStr}</span>
                                                        
                                                        {/* Status Pills */}
                                                        {email.category ? (
                                                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ml-1 ${
                                                                email.needsReview 
                                                                    ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                                                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                                            }`}>
                                                                {email.needsReview ? `Predicted: ${email.category}` : email.category}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] border border-slate-200 ml-1">
                                                                Unclassified
                                                            </span>
                                                        )}

                                                        {email.confidence !== null && email.category && (
                                                            <span className={`text-[10px] font-semibold ${
                                                                email.confidence >= 0.7 ? 'text-emerald-600' : 'text-amber-600'
                                                            }`}>
                                                                {confidencePercent}% confidence
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h4 className="font-bold text-sm text-[#1E293B] truncate mb-1">{email.subject}</h4>
                                                    <p className="text-xs text-[#64748B] truncate max-w-[550px]">{email.body || "No snippet available"}</p>
                                                </div>

                                                <div className="shrink-0 flex items-center gap-3">
                                                    {email.needsReview && (
                                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" title="Requires Review"></span>
                                                    )}
                                                    <svg className={`w-5 h-5 text-[#94A3B8] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </div>
                                            </div>

                                            {/* Expanded detail row */}
                                            {isExpanded && (
                                                <div className="px-5 pb-5 border-t border-[#F1F5F9] pt-4 bg-[#FAFAFA] rounded-b-2xl">
                                                    <div className="mb-4">
                                                        <h5 className="text-xs font-bold text-[#475569] uppercase tracking-wider mb-1.5">Email Body Snippet</h5>
                                                        <p className="text-xs text-[#334155] leading-relaxed bg-white border border-[#E2E8F0] p-3.5 rounded-xl whitespace-pre-wrap font-mono max-h-60 overflow-y-auto">
                                                            {email.body || "No body content."}
                                                        </p>
                                                    </div>

                                                    {/* AI Reasoning */}
                                                    {email.classifyReasoning && (
                                                        <div className="mb-5 bg-indigo-50/40 border border-indigo-100/60 p-3.5 rounded-xl">
                                                            <h5 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 mb-1">
                                                                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                                </svg>
                                                                Gemini Classifier Reasoning
                                                            </h5>
                                                            <p className="text-xs text-indigo-950 leading-relaxed font-medium">{email.classifyReasoning}</p>
                                                        </div>
                                                    )}

                                                    {/* Label / Feedback Controls */}
                                                    <div className="border-t border-[#E2E8F0] pt-4">
                                                        {actionLoadingId === email.messageId ? (
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B]">
                                                                <span className="w-5 h-5 border-2 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></span>
                                                                Submitting feedback and updating gRPC vector collections...
                                                            </div>
                                                        ) : email.category && email.needsReview ? (
                                                            // If predicted category is present and needs review
                                                            <div>
                                                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                                    <div>
                                                                        <h5 className="text-xs font-bold text-[#475569] mb-1">Verify AI Classification</h5>
                                                                        <p className="text-xs text-[#64748B]">Is this email correctly classified as <strong className="text-indigo-600 font-bold">{email.category}</strong>?</p>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={() => handleFeedback(email.messageId, email.category, email.category)}
                                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
                                                                        >
                                                                            Yes, Confirm
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                {/* Correct to another category options */}
                                                                <div className="mt-4 pt-3.5 border-t border-[#F1F5F9]">
                                                                    <p className="text-xs font-semibold text-[#64748B] mb-2.5">No, change category to:</p>
                                                                    {categories.length === 0 ? (
                                                                        <p className="text-xs text-[#94A3B8]">Define categories on the left panel to re-assign.</p>
                                                                    ) : (
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {categories.filter(c => c.name !== email.category).map(c => (
                                                                                <button
                                                                                    key={c.name}
                                                                                    onClick={() => handleFeedback(email.messageId, email.category, c.name)}
                                                                                    className="bg-white hover:bg-slate-50 border border-[#E2E8F0] hover:border-slate-300 text-[#475569] font-medium text-xs px-3.5 py-2 rounded-lg cursor-pointer transition-all"
                                                                                >
                                                                                    {c.name}
                                                                                </button>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            // If not categorized, or wants to change category
                                                            <div>
                                                                <h5 className="text-xs font-bold text-[#475569] mb-2.5">
                                                                    {email.category ? "Re-assign Category:" : "Label this Email to Train Classifier:"}
                                                                </h5>
                                                                {categories.length === 0 ? (
                                                                    <p className="text-xs text-[#94A3B8]">Define categories on the left panel to assign.</p>
                                                                ) : (
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {categories.map((c) => (
                                                                            <button
                                                                                key={c.name}
                                                                                onClick={() => {
                                                                                    if (email.category) {
                                                                                        handleFeedback(email.messageId, email.category, c.name)
                                                                                    } else {
                                                                                        handleLabelEmail(email.messageId, c.name)
                                                                                    }
                                                                                }}
                                                                                className={`font-semibold text-xs px-3.5 py-2 rounded-xl cursor-pointer border transition-all ${
                                                                                    email.category === c.name 
                                                                                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' 
                                                                                        : 'bg-white hover:bg-slate-50 border-[#E2E8F0] hover:border-slate-300 text-[#475569]'
                                                                                }`}
                                                                            >
                                                                                {c.name}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </section>

            </main>
        </div>
    )
}
