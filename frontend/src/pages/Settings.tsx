import React, { useEffect, useState } from 'react';
import { Settings as SettingsIcon, CheckCircle, AlertTriangle, Loader2, ExternalLink, RefreshCw, Zap } from 'lucide-react';
import { getAIStatus, type AIStatus } from '../lib/api';

export default function Settings() {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [keyInput, setKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const s = await getAIStatus();
      setAiStatus(s);
    } catch {
      setAiStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  // Settings are backend-side (env var). The UI explains how to set the key.
  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h2>
        <p className="text-textMuted">Configure your AI provider and learning preferences.</p>
      </div>

      {/* ── AI Provider ───────────────────────────────────────────────────── */}
      <div className="bg-surface border border-white/5 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-white">AI Provider</h3>
          </div>
          <button onClick={fetchStatus} title="Refresh status"
            className="text-textMuted hover:text-white transition-colors p-1 rounded">
            <RefreshCw className={`w-4 h-4 ${statusLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status badge */}
        <div className="mb-6">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-textMuted text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking AI status…
            </div>
          ) : aiStatus?.configured ? (
            <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-300 font-medium text-sm">Gemini AI is active</p>
                <p className="text-emerald-400/80 text-xs mt-1">
                  Provider: <span className="font-mono">gemini-2.0-flash</span> · All AI features are enabled.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium text-sm">Running in Mock Mode</p>
                <p className="text-amber-400/80 text-xs mt-1">
                  {aiStatus?.message ?? 'Set GEMINI_API_KEY in backend/.env to enable real AI.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* How to set the key */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-1">
              Gemini API Key
              {!aiStatus?.configured && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="ml-2 text-primary hover:underline inline-flex items-center gap-1 text-xs"
                >
                  Get a free key <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder={aiStatus?.configured ? '••••••••••••••• (key is set in .env)' : 'Paste your key here to copy into .env…'}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary transition-all pr-20"
              />
              {keyInput && (
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-textMuted hover:text-white"
                >
                  {showKey ? 'Hide' : 'Show'}
                </button>
              )}
            </div>
            <p className="text-xs text-textMuted mt-2">
              The key is read from <code className="bg-white/5 px-1 rounded">backend/.env</code>. Paste it above, then copy it into that file and restart the backend server.
            </p>
          </div>

          {keyInput && (
            <div className="bg-black/30 border border-white/10 rounded-lg p-3 font-mono text-xs text-emerald-300 select-all">
              GEMINI_API_KEY="{keyInput}"
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            >
              {saved ? <><CheckCircle className="w-4 h-4" />Copied!</> : 'Copy Snippet'}
            </button>
            <button
              onClick={fetchStatus}
              className="bg-surface hover:bg-white/5 border border-white/10 text-textMuted hover:text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Re-check Status
            </button>
          </div>

          <div className="bg-white/3 border border-white/5 rounded-lg p-3 text-xs text-textMuted space-y-1">
            <p className="font-medium text-white mb-1">Quick setup:</p>
            <p>1. Get a free key from Google AI Studio (link above)</p>
            <p>2. Paste it in the field above → copy the env snippet shown</p>
            <p>3. Open <code className="bg-white/5 px-1 rounded">backend/.env</code> and paste it in</p>
            <p>4. Restart the backend: <code className="bg-white/5 px-1 rounded">uvicorn main:app --reload</code></p>
            <p>5. Click "Re-check Status" — it should turn green</p>
          </div>
        </div>
      </div>

      {/* ── Learning Preferences (future) ─────────────────────────────────── */}
      <div className="bg-surface border border-white/5 rounded-xl p-6 opacity-60">
        <h3 className="text-lg font-bold text-white mb-1">Learning Preferences</h3>
        <p className="text-textMuted text-sm">Personalization settings coming in V2.</p>
      </div>
    </div>
  );
}
