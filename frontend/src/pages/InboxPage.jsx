import React, { useState, useEffect } from 'react';

export default function InboxPage() {
    const [userEmail, setUserEmail] = useState('buddhdevdarshan1478@gmail.com');
    const [emails, setEmails] = useState([]);
    const [scores, setScores] = useState({}); // emailId -> scoreData
    const [loading, setLoading] = useState(false);
    const [loadingScores, setLoadingScores] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('date'); // 'date' | 'importance'

    const fetchEmails = async (pageNumber, reset = false) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/inbox/emails?userEmail=${encodeURIComponent(userEmail)}&page=${pageNumber}&limit=20`);
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Failed to load emails');
            
            const newEmails = data.emails || [];
            if (reset) {
                setEmails(newEmails);
                setScores({});
            } else {
                setEmails(prev => [...prev, ...newEmails]);
            }
            
            setHasMore(data.page < data.pages);
            setPage(data.page);
            
            // Asynchronously fetch scores for these new emails
            fetchScores(newEmails);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchScores = async (emailsToScore) => {
        setLoadingScores(true);
        const promises = emailsToScore.map(async (email) => {
            try {
                const res = await fetch('/api/inbox/score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userEmail, emailId: email.emailId })
                });
                const data = await res.json();
                if (res.ok) {
                    setScores(prev => ({ ...prev, [email.emailId]: data }));
                }
            } catch (err) {
                console.error(`Failed to fetch score for ${email.emailId}`, err);
            }
        });

        await Promise.allSettled(promises);
        setLoadingScores(false);
    };

    useEffect(() => {
        if (userEmail) {
            fetchEmails(1, true);
        }
    }, [userEmail]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchEmails(page + 1, false);
        }
    };

    // Sort emails based on current toggle
    const sortedEmails = [...emails].sort((a, b) => {
        if (sortBy === 'date') {
            return new Date(b.date) - new Date(a.date);
        } else {
            const scoreA = scores[a.emailId]?.score || 0;
            const scoreB = scores[b.emailId]?.score || 0;
            return scoreB - scoreA;
        }
    });

    const getBadgeConfig = (scoreData) => {
        if (!scoreData) return { color: 'bg-gray-700 text-gray-300 border-gray-600', text: 'Loading...' };
        if (scoreData.fallback) return { color: 'bg-gray-800 text-gray-400 border-gray-700', text: 'Unavailable' };
        
        if (!scoreData.calibrated) {
            return { color: 'bg-slate-700/50 text-slate-300 border-slate-600', text: 'Still learning' };
        }
        
        const s = scoreData.score;
        if (s > 0.7) return { color: 'bg-green-900/40 text-green-400 border-green-800/50', text: 'Important' };
        if (s > 0.3) return { color: 'bg-yellow-900/40 text-yellow-400 border-yellow-800/50', text: 'Normal' };
        return { color: 'bg-red-900/40 text-red-400 border-red-800/50', text: 'Low Priority' };
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                        Intelligent Inbox
                    </h1>
                    <div className="flex gap-4 items-center">
                        <select 
                            value={sortBy} 
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
                        >
                            <option value="date">Sort by Date</option>
                            <option value="importance">Sort by Importance</option>
                        </select>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500 text-sm"
                            placeholder="User Email"
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {sortedEmails.map((email, i) => {
                        const scoreData = scores[email.emailId];
                        const badge = getBadgeConfig(scoreData);
                        
                        return (
                            <div key={`${email.emailId}-${i}`} className="bg-gray-800 border border-gray-700 rounded-xl p-5 hover:border-gray-600 transition-colors relative group">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-lg font-semibold text-purple-300 pr-32">{email.subject}</h2>
                                    
                                    {/* Importance Badge */}
                                    <div className="absolute right-5 top-5 flex items-center group/badge">
                                        <span className={`text-xs px-3 py-1 rounded-full border cursor-help ${badge.color}`}>
                                            {badge.text} {scoreData && scoreData.score ? `(${(scoreData.score * 100).toFixed(0)})` : ''}
                                        </span>
                                        
                                        {/* Tooltip for Reasons */}
                                        {scoreData && scoreData.reasons && scoreData.reasons.length > 0 && (
                                            <div className="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all z-10">
                                                <div className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">Why?</div>
                                                <ul className="text-sm text-gray-300 space-y-1">
                                                    {scoreData.reasons.map((r, idx) => (
                                                        <li key={idx} className="flex gap-2">
                                                            <span className="text-purple-400">•</span> {r}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-sm text-gray-400 mb-3 flex gap-4">
                                    <span className="font-medium">{email.from}</span>
                                    <span>{new Date(email.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-300 line-clamp-2 text-sm leading-relaxed">{email.snippet}</p>
                            </div>
                        );
                    })}
                </div>

                {emails.length === 0 && !loading && (
                    <div className="text-center text-gray-500 py-12">No emails found in your inbox.</div>
                )}

                {hasMore && emails.length > 0 && (
                    <div className="mt-8 text-center">
                        <button 
                            onClick={handleLoadMore}
                            disabled={loading}
                            className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-6 py-2 rounded-lg border border-gray-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
                
                {loadingScores && (
                    <div className="fixed bottom-4 right-4 bg-purple-900/50 border border-purple-500/50 text-purple-200 px-4 py-2 rounded-lg text-sm shadow-lg">
                        Analyzing importance...
                    </div>
                )}
            </div>
        </div>
    );
}
