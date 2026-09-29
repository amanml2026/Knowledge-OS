import React from 'react';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  return (
    <div className="p-8 max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <SearchIcon className="w-8 h-8 text-primary" />
          Semantic Search
        </h2>
        <p className="text-textMuted">Search through your concepts, documents, notes, and past mistakes.</p>
      </div>
      
      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
        <input 
          type="text" 
          placeholder="Ask a question or search for a topic... (e.g., 'Where did I learn about eigenvectors?')" 
          className="w-full bg-surface border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder:text-textMuted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
        />
      </div>

      <div className="flex-1 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl">
        <p className="text-textMuted">Search results will appear here.</p>
      </div>
    </div>
  );
}
