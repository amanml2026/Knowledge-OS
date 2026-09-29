import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Send, Loader2, AlertTriangle, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { conceptChat, getAIStatus, type ChatMode, type AIStatus } from '../lib/api';

const MODES: { id: ChatMode; label: string; description: string }[] = [
  { id: 'explain',   label: 'Explain',     description: 'Clear, structured explanation with examples' },
  { id: 'socratic',  label: 'Socratic',    description: 'Guided questions to discover insights yourself' },
  { id: 'feynman',   label: 'Feynman',     description: 'Simple analogies, like teaching a 12-year-old' },
  { id: 'intuition', label: 'Intuition',   description: 'Mental models and first-principles reasoning' },
  { id: 'math',      label: 'Mathematical', description: 'Rigorous definitions, theorems, and proofs' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Learn() {
  const [topic, setTopic] = useState('');
  const [mode, setMode] = useState<ChatMode>('explain');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [modeOpen, setModeOpen] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getAIStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    if (!topic.trim()) return;
    setSessionStarted(true);
    await sendMessage(topic, true);
  };

  const sendMessage = async (text: string, isFirst = false) => {
    const userMsg: Message = { role: 'user', content: text };
    const history = isFirst ? [] : messages;
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    setInput('');
    try {
      const context = history.map(m => `${m.role === 'user' ? 'Student' : 'Tutor'}: ${m.content}`).join('\n');
      const res = await conceptChat({ topic: text, mode, context: context || undefined });
      setMessages(prev => [...prev, { role: 'assistant', content: res.response }]);
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Connection error. Is the backend running?';
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input);
  };

  const selectedMode = MODES.find(m => m.id === mode)!;

  if (!sessionStarted) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Learn Mode
          </h2>
          <p className="text-textMuted">Engage with your AI tutor to build deep understanding of new concepts.</p>
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

        <div className="bg-surface border border-white/5 rounded-xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">What do you want to learn?</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startSession()}
              placeholder="e.g. Backpropagation, Quantum entanglement, The French Revolution..."
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textMuted mb-3">Learning Mode</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  title={m.description}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    mode === m.id
                      ? 'bg-primary border-primary text-white'
                      : 'bg-black/20 border-white/10 text-textMuted hover:border-white/30 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-textMuted mt-2">{selectedMode.description}</p>
          </div>

          <button
            onClick={startSession}
            disabled={!topic.trim()}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Start Learning Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            {topic}
          </h2>
          <p className="text-textMuted text-sm mt-1">Mode: {selectedMode.label} · {selectedMode.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode switcher inline */}
          <div className="relative">
            <button
              onClick={() => setModeOpen(!modeOpen)}
              className="flex items-center gap-1.5 bg-surface border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white hover:border-white/30 transition-colors"
            >
              {selectedMode.label} <ChevronDown className="w-3.5 h-3.5 text-textMuted" />
            </button>
            {modeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-surface border border-white/10 rounded-xl shadow-xl z-10 py-1 min-w-[160px]">
                {MODES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setMode(m.id); setModeOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      mode === m.id ? 'text-primary bg-primary/10' : 'text-textMuted hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => { setSessionStarted(false); setMessages([]); setTopic(''); }}
            className="text-xs text-textMuted hover:text-white bg-surface border border-white/10 rounded-lg px-3 py-1.5 transition-colors"
          >
            New Session
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-primary text-white rounded-br-sm'
                : 'bg-surface border border-white/5 text-textMain rounded-bl-sm'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              ) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-white/5 rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
              <span className="text-textMuted text-sm">Gemini is thinking…</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask a follow-up question…"
          disabled={loading}
          className="flex-1 bg-surface border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-4 transition-colors"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
