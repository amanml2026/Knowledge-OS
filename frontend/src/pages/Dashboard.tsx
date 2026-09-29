import React from 'react';
import { Target, Clock, Zap, AlertCircle } from 'lucide-react';

function Dashboard() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back, Scholar</h2>
          <p className="text-textMuted">You have a 12-day learning streak. Keep it up!</p>
        </div>
        <button className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Zap className="w-4 h-4" />
          Start Learning Session
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Concepts Mastered', value: '42', icon: Target, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
          { label: 'Review Queue', value: '14', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
          { label: 'Weak Concepts', value: '3', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
          { label: 'Hours Learned', value: '28h', icon: Zap, color: 'text-primary', bg: 'bg-primary/10' },
        ].map((stat, i) => (
          <div key={i} className="bg-surface rounded-xl p-5 border border-white/5">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <span className="text-sm text-textMuted font-medium">{stat.label}</span>
            </div>
            <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface rounded-xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">Today's Mission</h3>
            <div className="space-y-3">
              {[
                { title: 'Review Partial Derivatives', time: '10 min', type: 'Review' },
                { title: 'Learn Chain Rule', time: '20 min', type: 'Learn' },
                { title: 'Solve 3 Backprop Problems', time: '15 min', type: 'Practice' },
              ].map((task, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-black/20 hover:bg-black/40 transition-colors border border-white/5 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-5 h-5 rounded border-2 border-textMuted flex items-center justify-center"></div>
                    <div>
                      <h4 className="font-medium text-white">{task.title}</h4>
                      <p className="text-xs text-textMuted">{task.type}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-textMuted">{task.time}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-surface rounded-xl p-6 border border-white/5">
             <h3 className="text-xl font-bold text-white mb-4">Recent Mistake Patterns</h3>
             <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200">
                <p className="text-sm font-medium mb-1">Attention needed: Conditional Probability</p>
                <p className="text-xs text-rose-300/80">You've missed 3 questions involving Bayes Theorem applications. Consider reviewing the foundational intuition.</p>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface rounded-xl p-6 border border-white/5">
            <h3 className="text-xl font-bold text-white mb-4">Current Path</h3>
            <div className="relative pl-6 space-y-6 border-l-2 border-white/10 ml-2">
              <div className="relative">
                <div className="absolute -left-[1.65rem] w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-surface"></div>
                <h4 className="text-sm font-medium text-white">Derivatives</h4>
                <p className="text-xs text-textMuted">Mastered (92%)</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[1.65rem] w-4 h-4 rounded-full bg-primary ring-4 ring-surface"></div>
                <h4 className="text-sm font-medium text-white">Chain Rule</h4>
                <p className="text-xs text-textMuted">Learning now</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[1.65rem] w-4 h-4 rounded-full bg-white/10 ring-4 ring-surface"></div>
                <h4 className="text-sm font-medium text-textMuted">Backpropagation</h4>
                <p className="text-xs text-textMuted/50">Locked</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
