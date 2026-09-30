import React, { useState, useRef, useEffect } from 'react';
import { Search as SearchIcon, Loader2, Brain, FileText, AlertCircle, BookOpen, ChevronRight } from 'lucide-react';
import { searchAll, type SearchResult } from '../lib/api';

const TYPE_ICONS = {
  concept: Brain,
  document: FileText,
  mistake: AlertCircle,
};

const TYPE_LABELS = {
  concept: 'Concept',
  document: 'Document',
  mistake: 'Mistake',
};

const TYPE_COLORS = {
  concept: 'text-primary bg-primary/10 border-primary/20',
  document: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  mistake: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
};

const MASTERY_COLORS = {
  high: 'text-emerald-400',
  med: 'text-amber-400',
  low: 'text-rose-400',
};

function getMasteryClass(v?: number): string {
  if (v === undefined) return '';
  if (v >= 0.8) return MASTERY_COLORS.high;
  if (v >= 0.4) return MASTERY_COLORS.med;
  return MASTERY_COLORS.low;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await searchAll(q);
      setResults(res.results);
      setSearched(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Search failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search on input change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      setLoading(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const grouped = {
    concept: results.filter(r => r.type === 'concept'),
    document: results.filter(r => r.type === 'document'),
    mistake: results.filter(r => r.type === 'mistake'),
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SearchIcon className="w-8 h-8 text-primary" />
          Semantic Search
        </h2>
        <p className="text-textMuted">Search across your concepts, documents, and tracked mistakes.</p>
      </div>

      {/* Search input */}
      <div className="relative mb-8">
        {loading
          ? <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
          : <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
        }
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && doSearch(query)}
          placeholder="Search concepts, documents, mistakes… e.g. 'eigenvectors'"
          className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          autoFocus
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setSearched(false); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-textMuted hover:text-white text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 text-rose-300 text-sm">
          {error}
        </div>
      )}

      {/* Empty state before any search */}
      {!searched && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-xl">
          <SearchIcon className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-textMuted text-sm">Start typing to search across your knowledge base</p>
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {['eigenvectors', 'gradient descent', 'Bayes', 'chain rule'].map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className="text-xs text-textMuted bg-surface border border-white/10 px-3 py-1.5 rounded-full hover:border-white/30 hover:text-white transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searched && results.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-white/5 rounded-xl">
          <p className="text-textMuted">No results found for <span className="text-white">"{query}"</span></p>
          <p className="text-textMuted text-sm mt-1">Try a different keyword or add more concepts.</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          <p className="text-textMuted text-sm">{results.length} result{results.length !== 1 ? 's' : ''} for <span className="text-white">"{query}"</span></p>

          {(['concept', 'document', 'mistake'] as const).map(type => {
            const group = grouped[type];
            if (group.length === 0) return null;
            const Icon = TYPE_ICONS[type];
            return (
              <div key={type}>
                <h3 className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5" /> {TYPE_LABELS[type]}s ({group.length})
                </h3>
                <div className="space-y-2">
                  {group.map(r => (
                    <div key={`${r.type}-${r.id}`}
                      className="bg-surface border border-white/5 rounded-xl p-4 hover:border-white/15 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[r.type]}`}>
                              {TYPE_LABELS[r.type]}
                            </span>
                            {r.type === 'concept' && r.mastery !== undefined && (
                              <span className={`text-xs font-medium ${getMasteryClass(r.mastery)}`}>
                                {Math.round(r.mastery * 100)}% mastery
                              </span>
                            )}
                            {r.type === 'mistake' && (
                              <span className={`text-xs ${r.corrected ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {r.corrected ? '✓ corrected' : '⚠ open'}
                              </span>
                            )}
                          </div>
                          <p className="text-white font-medium text-sm">{r.title}</p>
                          {r.snippet && (
                            <p className="text-textMuted text-xs mt-1 line-clamp-2">{r.snippet}</p>
                          )}
                        </div>
                        <ChevronRight className="w-4 h-4 text-textMuted flex-shrink-0 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
