import React from 'react';
import { PenTool } from 'lucide-react';

export default function Practice() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <PenTool className="w-8 h-8 text-primary" />
          Practice & Review
        </h2>
        <p className="text-textMuted">Test your understanding through spaced repetition and AI-generated exercises.</p>
      </div>
      
      <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <PenTool className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">You're all caught up!</h3>
        <p className="text-textMuted max-w-md mx-auto mb-6">
          There are no concepts due for review today. You can force a review session or practice a specific topic.
        </p>
        <button className="bg-surface hover:bg-white/5 border border-white/10 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Practice Specific Topic
        </button>
      </div>
    </div>
  );
}
