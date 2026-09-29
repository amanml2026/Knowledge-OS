import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          Settings
        </h2>
        <p className="text-textMuted">Configure your AI providers and learning preferences.</p>
      </div>
      
      <div className="bg-surface border border-white/5 rounded-xl p-6 max-w-2xl">
        <h3 className="text-xl font-bold text-white mb-4 border-b border-white/10 pb-4">AI Provider</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-textMuted mb-2">Gemini API Key</label>
            <input 
              type="password" 
              placeholder="AI is currently running in Mock Mode..."
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-textMuted mt-2">Leave blank to use local Mock mode.</p>
          </div>
          
          <button className="bg-surface hover:bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
