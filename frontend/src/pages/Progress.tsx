import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function Progress() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-primary" />
          Progress Analytics
        </h2>
        <p className="text-textMuted">Track your learning journey and mastery over time.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface border border-white/5 rounded-xl p-6 h-64 flex items-center justify-center">
            <p className="text-textMuted">Mastery Chart Placeholder</p>
        </div>
        <div className="bg-surface border border-white/5 rounded-xl p-6 h-64 flex items-center justify-center">
            <p className="text-textMuted">Activity Heatmap Placeholder</p>
        </div>
      </div>
    </div>
  );
}
