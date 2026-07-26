import React, { useState } from 'react';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';

export default function SearchPage() {
    const [query, setQuery] = useState('');
    const [userEmail, setUserEmail] = useState('bench@test.com');
    const [results, setResults] = useState([]);
    const [timings, setTimings] = useState(null);
    const [interpretation, setInterpretation] = useState(null);
    const [degraded, setDegraded] = useState(false);
    const [stagesTimedOut, setStagesTimedOut] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            const res = await fetch('/api/search/v2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, userEmail })
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Search failed');
            
            setResults(data.results || []);
            setTimings(data.timings);
            setInterpretation(data.query_interpretation);
            setDegraded(data.degraded || false);
            setStagesTimedOut(data.stages_timed_out || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                    AI Hybrid Search
                </h1>

                <form onSubmit={handleSearch} className="mb-8 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-2">User Email (Simulated Auth)</label>
                        <input
                            type="email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
                        />
                    </div>
                    
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Try 'budget review from:sarah'..."
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-4 pr-12 py-4 text-lg focus:outline-none focus:border-purple-500 transition-colors"
                        />
                        <button 
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-md transition-colors disabled:opacity-50"
                        >
                            <FiSearch size={24} />
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-8">
                        {error}
                    </div>
                )}

                {degraded && (
                    <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-4 rounded-lg mb-8 flex items-start gap-3">
                        <FiAlertTriangle className="mt-1 flex-shrink-0" size={20} />
                        <div>
                            <h3 className="font-semibold">Partial Results (Degraded Performance)</h3>
                            <p className="text-sm opacity-90 mt-1">
                                The following search stages timed out and were skipped: <span className="font-mono bg-yellow-950 px-1 rounded">{stagesTimedOut.join(', ')}</span>. 
                                Your results may be incomplete.
                            </p>
                        </div>
                    </div>
                )}

                {timings && (
                    <div className="flex gap-4 text-xs text-gray-400 mb-6 bg-gray-800/50 p-3 rounded-lg">
                        <span>Total: {timings.total_ms?.toFixed(1)}ms</span>
                        <span>routing: {timings.routing_ms?.toFixed(1)}ms</span>
                        <span>bm25: {timings.bm25_ms?.toFixed(1)}ms</span>
                        <span>vector: {timings.vector_ms?.toFixed(1)}ms</span>
                        <span>rerank: {timings.rerank_ms?.toFixed(1)}ms</span>
                    </div>
                )}

                <div className="space-y-6">
                    {results.map((r, i) => (
                        <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <h2 className="text-xl font-semibold text-purple-300">{r.subject}</h2>
                                <span className="text-xs font-mono bg-gray-900 px-2 py-1 rounded text-gray-400 border border-gray-700">
                                    Score: {r.scores?.final?.toFixed(4)}
                                </span>
                            </div>
                            <div className="text-sm text-gray-400 mb-4 flex gap-4">
                                <span>From: {r.sender}</span>
                                <span>{new Date(r.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300 line-clamp-3">{r.snippet}</p>
                        </div>
                    ))}
                    {!loading && results.length === 0 && timings && (
                        <div className="text-center text-gray-500 py-12">No results found.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
