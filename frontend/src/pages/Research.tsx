import React from 'react';
import { Beaker } from 'lucide-react';

export default function Research() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Beaker className="w-8 h-8 text-primary" />
          Research Workspace
        </h2>
        <p className="text-textMuted">Design experiments, test hypotheses, and conduct AI-assisted research.</p>
      </div>
      
      <div className="bg-surface border border-white/5 rounded-xl p-12 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Beaker className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No Active Projects</h3>
        <p className="text-textMuted max-w-md mx-auto mb-6">
          Start a new research project to begin formulating hypotheses and collecting references.
        </p>
        <button className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-colors">
          New Research Project
        </button>
      </div>
    </div>
  );
}
