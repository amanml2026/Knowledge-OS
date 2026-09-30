import React, { useState, useEffect } from 'react';
import { Beaker, Send, Loader2, AlertTriangle, BookOpen, ChevronRight, FileText, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  researchAssistant, generateLearningPath, analyzeDocument, getAIStatus, saveDocument,
  type ResearchResponse, type LearningPathStep, type AIStatus,
} from '../lib/api';

type Tab = 'research' | 'learning-path' | 'document';

export default function Research() {
  const [tab, setTab] = useState<Tab>('research');
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);

  useEffect(() => {
    getAIStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Beaker className="w-8 h-8 text-primary" />
          Research Workspace
        </h2>
        <p className="text-textMuted">AI-assisted research, personalized learning paths, and document analysis.</p>
      </div>

      {aiStatus && !aiStatus.configured && (
        <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 font-medium text-sm">AI running in Mock Mode</p>
            <p className="text-amber-400/80 text-xs mt-1">{aiStatus.message}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-surface border border-white/5 rounded-xl p-1 mb-6 w-fit">
        {[
          { id: 'research' as Tab, label: 'Research Assistant', icon: Beaker },
          { id: 'learning-path' as Tab, label: 'Learning Path', icon: BookOpen },
          { id: 'document' as Tab, label: 'Document Analysis', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === id ? 'bg-primary text-white' : 'text-textMuted hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'research' && <ResearchTab />}
      {tab === 'learning-path' && <LearningPathTab />}
      {tab === 'document' && <DocumentTab />}
    </div>
  );
}

// ── Research Assistant ───────────────────────────────────────────────────────

function ResearchTab() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ask = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await researchAssistant({ question });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask()}
          placeholder="Ask a research question… e.g. 'How does attention mechanism work in transformers?'"
          className="flex-1 bg-surface border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-40 text-white rounded-xl px-4 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>}

      {result && (
        <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.answer}</ReactMarkdown>
          </div>
          {result.follow_up_questions.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-textMuted uppercase tracking-wide mb-2">Follow-up Questions</p>
              <div className="space-y-2">
                {result.follow_up_questions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuestion(q); }}
                    className="flex items-center gap-2 w-full text-left text-sm text-textMuted hover:text-white bg-black/20 hover:bg-black/40 border border-white/5 rounded-lg px-3 py-2 transition-colors"
                  >
                    <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Learning Path ────────────────────────────────────────────────────────────

function LearningPathTab() {
  const [goal, setGoal] = useState('');
  const [currentKnowledge, setCurrentKnowledge] = useState('');
  const [path, setPath] = useState<LearningPathStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError('');
    setPath([]);
    try {
      const res = await generateLearningPath({ goal, current_knowledge: currentKnowledge || undefined });
      setPath(res.path);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Learning Goal</label>
          <input
            type="text"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="e.g. Master deep learning from scratch, Understand quantum computing..."
            className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Current Knowledge (optional)</label>
          <input
            type="text"
            value={currentKnowledge}
            onChange={e => setCurrentKnowledge(e.target.value)}
            placeholder="e.g. Basic Python, high-school calculus, linear algebra..."
            className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={generate}
          disabled={!goal.trim() || loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Path…</> : <>Generate Learning Path</>}
        </button>
      </div>

      {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>}

      {path.length > 0 && (
        <div className="relative pl-8 ml-4 border-l-2 border-white/10 space-y-6">
          {path.map((step, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[2.25rem] w-7 h-7 rounded-full bg-surface border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                {step.step}
              </div>
              <div className="bg-surface border border-white/5 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-white">{step.topic}</h4>
                  {step.estimated_hours && (
                    <span className="text-xs text-textMuted bg-black/30 px-2 py-0.5 rounded ml-3 flex-shrink-0">
                      ~{step.estimated_hours}h
                    </span>
                  )}
                </div>
                <p className="text-textMuted text-sm mt-1">{step.description}</p>
                {step.prerequisites && step.prerequisites.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {step.prerequisites.map((p, j) => (
                      <span key={j} className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded">
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Document Analysis ────────────────────────────────────────────────────────

function DocumentTab() {
  const [content, setContent] = useState('');
  const [instruction, setInstruction] = useState('');
  const [result, setResult] = useState<{ summary: string; key_concepts: { concept: string; definition: string }[]; important_terms: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!content.trim() || loading) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await analyzeDocument({ content, instruction: instruction || undefined });
      setResult(res);
      // Auto-save document to backend so it appears in Search
      const title = content.split('\n')[0].slice(0, 80) || 'Untitled Document';
      saveDocument({ title, content }).catch(() => { /* non-blocking */ });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Document / Text</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste your document, article, notes, or any text here…"
            rows={8}
            className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition-all resize-none font-mono text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-textMuted mb-2">Custom Instruction (optional)</label>
          <input
            type="text"
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="e.g. Focus on mathematical concepts, Extract action items..."
            className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <button
          onClick={analyze}
          disabled={!content.trim() || loading}
          className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Analyzing…</> : <><FileText className="w-4 h-4" />Analyze Document</>}
        </button>
      </div>

      {error && <p className="text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl px-4 py-3">{error}</p>}

      {result && (
        <div className="space-y-4">
          <div className="bg-surface border border-white/5 rounded-xl p-6">
            <h3 className="text-white font-semibold mb-3">Summary</h3>
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.summary}</ReactMarkdown>
            </div>
          </div>
          {result.key_concepts.length > 0 && (
            <div className="bg-surface border border-white/5 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Key Concepts</h3>
              <div className="space-y-3">
                {result.key_concepts.map((kc, i) => (
                  <div key={i} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-white text-sm font-medium">{kc.concept}</p>
                    <p className="text-textMuted text-xs mt-0.5">{kc.definition}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.important_terms.length > 0 && (
            <div className="bg-surface border border-white/5 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-3">Important Terms</h3>
              <div className="flex flex-wrap gap-2">
                {result.important_terms.map((term, i) => (
                  <span key={i} className="text-sm bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
