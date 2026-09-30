import React, { useEffect, useState } from 'react';
import { TrendingUp, Target, AlertCircle, CheckCircle, Brain, Loader2, RefreshCw, BookOpen, XCircle } from 'lucide-react';
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts';
import { getStats, getMistakes, markMistakeCorrected, type ProgressStats, type Mistake } from '../lib/api';

export default function Progress() {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [s, m] = await Promise.all([getStats(), getMistakes()]);
      setStats(s);
      setMistakes(m);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load data. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCorrect = async (id: number) => {
    try {
      await markMistakeCorrected(id);
      setMistakes(prev => prev.map(m => m.id === id ? { ...m, corrected: true } : m));
    } catch { /* silent */ }
  };

  const severityColor: Record<string, string> = {
    high: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    low: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
  };

  const masteryColor = (v: number) =>
    v >= 80 ? '#10B981' : v >= 50 ? '#6366F1' : '#F59E0B';

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-rose-300 font-medium">Backend connection failed</p>
            <p className="text-rose-400/80 text-sm mt-1">{error}</p>
            <button onClick={load} className="mt-3 text-sm bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────────────
  if (!stats || stats.total_concepts === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Progress Analytics
          </h2>
          <p className="text-textMuted">Track your learning journey and mastery over time.</p>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <p className="text-white font-semibold text-lg mb-2">No data yet</p>
          <p className="text-textMuted text-sm max-w-sm mx-auto">
            Add concepts to your Knowledge Graph and complete Practice sessions to see your progress here.
          </p>
        </div>
      </div>
    );
  }

  const radialData = [
    { name: 'Mastery', value: stats.avg_mastery, fill: '#6366F1' },
  ];

  const topConcepts = [...stats.concept_mastery]
    .sort((a, b) => b.mastery - a.mastery)
    .slice(0, 10);

  const openMistakes = mistakes.filter(m => !m.corrected);
  const correctedMistakes = mistakes.filter(m => m.corrected);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-primary" />
            Progress Analytics
          </h2>
          <p className="text-textMuted">Track your learning journey and mastery over time.</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 text-sm text-textMuted hover:text-white bg-surface border border-white/10 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Concepts', value: stats.total_concepts, icon: BookOpen, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Mastered (≥80%)', value: stats.mastered, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Learning', value: stats.learning, icon: Target, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Open Mistakes', value: stats.open_mistakes, icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
        ].map((s, i) => (
          <div key={i} className="bg-surface border border-white/5 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg}`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <span className="text-xs text-textMuted font-medium">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Radial overall mastery */}
        <div className="bg-surface border border-white/5 rounded-xl p-6 flex flex-col items-center justify-center">
          <h3 className="text-white font-semibold mb-4 self-start">Overall Mastery</h3>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart innerRadius="60%" outerRadius="90%" data={radialData} startAngle={90} endAngle={90 - (stats.avg_mastery / 100) * 360}>
              <RadialBar dataKey="value" cornerRadius={8} fill="#6366F1" />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-4xl font-bold text-white -mt-4">{stats.avg_mastery}%</p>
          <p className="text-textMuted text-sm mt-1">Average across {stats.total_concepts} concepts</p>
        </div>

        {/* Mastery bar chart */}
        <div className="lg:col-span-2 bg-surface border border-white/5 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">Concept Mastery</h3>
          {topConcepts.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={topConcepts} margin={{ top: 0, right: 0, bottom: 0, left: -30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="title" tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false}
                  tickFormatter={v => v.length > 10 ? v.slice(0, 10) + '…' : v} />
                <YAxis domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                  formatter={(v: number) => [`${v}%`, 'Mastery']}
                />
                <Bar dataKey="mastery" radius={[4, 4, 0, 0]}>
                  {topConcepts.map((entry, i) => (
                    <Cell key={i} fill={masteryColor(entry.mastery)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center">
              <p className="text-textMuted text-sm">Complete practice sessions to see mastery data.</p>
            </div>
          )}
        </div>
      </div>

      {/* Mistakes tracker */}
      <div className="bg-surface border border-white/5 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            Mistake Tracker
            {openMistakes.length > 0 && (
              <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
                {openMistakes.length} open
              </span>
            )}
          </h3>
          {correctedMistakes.length > 0 && (
            <span className="text-xs text-textMuted">{correctedMistakes.length} corrected</span>
          )}
        </div>

        {mistakes.length === 0 ? (
          <div className="flex items-center justify-center py-10">
            <div className="text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-white font-medium">No mistakes tracked yet</p>
              <p className="text-textMuted text-sm mt-1">Mistakes from Practice sessions will appear here automatically.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {openMistakes.map(m => (
              <div key={m.id} className={`flex items-start gap-4 border rounded-xl p-4 ${severityColor[m.severity]}`}>
                <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white line-clamp-2">{m.question}</p>
                  {m.misconception && (
                    <p className="text-xs opacity-80 mt-1 line-clamp-2">{m.misconception}</p>
                  )}
                  <span className="text-xs opacity-60 mt-1 block">
                    {new Date(m.date).toLocaleDateString()} · {m.severity} severity
                  </span>
                </div>
                <button
                  onClick={() => handleCorrect(m.id)}
                  className="flex-shrink-0 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                >
                  <CheckCircle className="w-3 h-3" /> Mark fixed
                </button>
              </div>
            ))}
            {correctedMistakes.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-textMuted cursor-pointer hover:text-white select-none">
                  Show {correctedMistakes.length} corrected mistake{correctedMistakes.length > 1 ? 's' : ''}
                </summary>
                <div className="space-y-2 mt-2">
                  {correctedMistakes.map(m => (
                    <div key={m.id} className="flex items-start gap-3 border border-white/5 bg-white/3 rounded-xl p-3 opacity-60">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-textMuted line-clamp-1">{m.question}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
