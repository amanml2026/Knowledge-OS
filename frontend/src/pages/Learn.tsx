import React from 'react';
import { BookOpen } from 'lucide-react';

export default function Learn() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-primary" />
          Learn Mode
        </h2>
        <p className="text-textMuted">Engage with your AI tutor to build deep understanding of new concepts.</p>
      </div>
      
      <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Session</h3>
        <p className="text-textMuted max-w-md mx-auto mb-6">
          You haven't started a learning session yet. Select a concept from your Knowledge Base or type a topic below to begin.
        </p>
        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          Start Learning
        </button>
      </div>
    </div>
  );
}
