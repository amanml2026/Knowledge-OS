import React, { useState, useEffect } from 'react';
import { PenTool, Loader2, CheckCircle, XCircle, ChevronRight, AlertTriangle } from 'lucide-react';
import { generatePractice, evaluateAnswer, getAIStatus, createMistake, type PracticeQuestion, type AIStatus } from '../lib/api';

type Difficulty = 'easy' | 'medium' | 'hard';
type Phase = 'setup' | 'quiz' | 'results';

interface AnswerState {
  question: PracticeQuestion;
  userAnswer: string;
  evaluation: { score: number; feedback: string; misconceptions: string[]; correct_reasoning: string } | null;
  submitted: boolean;
}

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  hard: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
};

export default function Practice() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [count, setCount] = useState(3);
  const [phase, setPhase] = useState<Phase>('setup');
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [draftAnswer, setDraftAnswer] = useState('');

  useEffect(() => {
    getAIStatus().then(setAiStatus).catch(() => setAiStatus(null));
  }, []);

  const startQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await generatePractice({ topic, difficulty, count });
      const qs = res.questions;
      setQuestions(qs);
      setAnswers(qs.map(q => ({ question: q, userAnswer: '', evaluation: null, submitted: false })));
      setCurrentIndex(0);
      setDraftAnswer('');
      setPhase('quiz');
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Failed to generate questions.';
      alert(`Error: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!draftAnswer.trim() || evaluating) return;
    setEvaluating(true);
    const q = questions[currentIndex];
    try {
      const result = await evaluateAnswer({
        question: q.question,
        user_answer: draftAnswer,
        correct_answer: q.correct_answer,
        topic,
      });
      setAnswers(prev => {
        const next = [...prev];
        next[currentIndex] = { ...next[currentIndex], userAnswer: draftAnswer, evaluation: result, submitted: true };
        return next;
      });
      // Auto-save low-scoring answers as mistakes for the Progress tracker
      if (result.score < 0.5) {
        createMistake({
          question: q.question,
          user_answer: draftAnswer,
          correct_reasoning: result.correct_reasoning || q.correct_answer,
          misconception: result.misconceptions.join('; ') || result.feedback,
          severity: result.score < 0.2 ? 'high' : 'medium',
        }).catch(() => { /* non-blocking */ });
      }
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : 'Evaluation failed.';
      setAnswers(prev => {
        const next = [...prev];
        next[currentIndex] = { ...next[currentIndex], userAnswer: draftAnswer, evaluation: { score: 0, feedback: errMsg, misconceptions: [], correct_reasoning: '' }, submitted: true };
        return next;
      });
    } finally {
      setEvaluating(false);
    }
  };

  const next = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setDraftAnswer('');
    } else {
      setPhase('results');
    }
  };

  const avgScore = answers.length > 0
    ? answers.reduce((s, a) => s + (a.evaluation?.score ?? 0), 0) / answers.length
    : 0;

  // ── Setup ────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <PenTool className="w-8 h-8 text-primary" />
            Practice & Review
          </h2>
          <p className="text-textMuted">AI-generated exercises with real-time evaluation and misconception detection.</p>
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
            <label className="block text-sm font-medium text-textMuted mb-2">Topic to practice</label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && startQuiz()}
              placeholder="e.g. Newton's Laws, Gradient Descent, Photosynthesis..."
              className="w-full bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          <div className="flex gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-textMuted mb-3">Difficulty</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border capitalize transition-all ${
                      difficulty === d ? DIFFICULTY_STYLES[d] : 'bg-black/20 border-white/10 text-textMuted hover:border-white/30'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-textMuted mb-3">Questions</label>
              <div className="flex gap-2">
                {[3, 5, 10].map(n => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    className={`w-12 py-2 rounded-lg text-sm font-medium border transition-all ${
                      count === n ? 'bg-primary border-primary text-white' : 'bg-black/20 border-white/10 text-textMuted hover:border-white/30'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={!topic.trim() || loading}
            className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Generating Questions…</> : <><PenTool className="w-4 h-4" />Generate Practice Session</>}
          </button>
        </div>
      </div>
    );
  }

  // ── Quiz ─────────────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[currentIndex];
    const ans = answers[currentIndex];
    const score = ans.evaluation?.score ?? 0;

    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <PenTool className="w-6 h-6 text-primary" />
              {topic}
            </h2>
            <p className="text-textMuted text-sm mt-1">Question {currentIndex + 1} of {questions.length} · {difficulty}</p>
          </div>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i < currentIndex
                    ? 'bg-emerald-500'
                    : i === currentIndex
                    ? 'bg-primary'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-surface border border-white/5 rounded-xl p-6 mb-4">
          <p className="text-white font-medium text-base leading-relaxed mb-2">{q.question}</p>
          <span className="text-xs text-textMuted bg-black/20 px-2 py-0.5 rounded capitalize">{q.type?.replace('_', ' ')}</span>

          {q.type === 'multiple_choice' && q.options && !ans.submitted && (
            <div className="mt-4 space-y-2">
              {q.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setDraftAnswer(opt)}
                  className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${
                    draftAnswer === opt
                      ? 'border-primary bg-primary/10 text-white'
                      : 'border-white/10 bg-black/20 text-textMuted hover:border-white/30 hover:text-white'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type !== 'multiple_choice' && !ans.submitted && (
            <textarea
              value={draftAnswer}
              onChange={e => setDraftAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={4}
              className="w-full mt-4 bg-black/30 border border-white/10 rounded-lg py-3 px-4 text-white placeholder:text-textMuted/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
            />
          )}

          {!ans.submitted && (
            <button
              onClick={submitAnswer}
              disabled={!draftAnswer.trim() || evaluating}
              className="mt-4 w-full bg-primary hover:bg-primary/90 disabled:opacity-40 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {evaluating ? <><Loader2 className="w-4 h-4 animate-spin" />Evaluating…</> : 'Submit Answer'}
            </button>
          )}
        </div>

        {/* Feedback panel */}
        {ans.submitted && ans.evaluation && (
          <div className="bg-surface border border-white/5 rounded-xl p-6 mb-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white flex items-center gap-2">
                {score >= 0.7
                  ? <CheckCircle className="w-5 h-5 text-emerald-400" />
                  : <XCircle className="w-5 h-5 text-rose-400" />}
                {score >= 0.7 ? 'Good understanding!' : 'Needs improvement'}
              </h3>
              <span className={`text-lg font-bold ${score >= 0.7 ? 'text-emerald-400' : score >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
                {Math.round(score * 100)}%
              </span>
            </div>
            <p className="text-textMuted text-sm">{ans.evaluation.feedback}</p>
            {ans.evaluation.misconceptions.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p className="text-rose-300 text-sm font-medium mb-1">Misconceptions detected:</p>
                <ul className="list-disc list-inside space-y-1">
                  {ans.evaluation.misconceptions.map((m, i) => (
                    <li key={i} className="text-rose-300/80 text-xs">{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {ans.evaluation.correct_reasoning && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                <p className="text-emerald-300 text-sm font-medium mb-1">Correct reasoning:</p>
                <p className="text-emerald-300/80 text-xs">{ans.evaluation.correct_reasoning}</p>
              </div>
            )}
            <button
              onClick={next}
              className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex < questions.length - 1 ? <>Next Question <ChevronRight className="w-4 h-4" /></> : 'See Results'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────────────────
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Session Complete</h2>
        <p className="text-textMuted">Topic: {topic} · {difficulty}</p>
      </div>
      <div className="bg-surface border border-white/5 rounded-xl p-8 text-center mb-6">
        <div className={`text-6xl font-bold mb-2 ${avgScore >= 0.7 ? 'text-emerald-400' : avgScore >= 0.4 ? 'text-amber-400' : 'text-rose-400'}`}>
          {Math.round(avgScore * 100)}%
        </div>
        <p className="text-textMuted">Average Score · {questions.length} questions</p>
      </div>
      <div className="space-y-3 mb-6">
        {answers.map((ans, i) => (
          <div key={i} className="flex items-center gap-4 bg-surface border border-white/5 rounded-xl p-4">
            <span className={`text-sm font-bold w-12 text-center ${(ans.evaluation?.score ?? 0) >= 0.7 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {Math.round((ans.evaluation?.score ?? 0) * 100)}%
            </span>
            <p className="text-white text-sm flex-1 line-clamp-2">{ans.question.question}</p>
          </div>
        ))}
      </div>
      <button
        onClick={() => { setPhase('setup'); setQuestions([]); setAnswers([]); setTopic(''); }}
        className="w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-lg font-medium transition-colors"
      >
        Start New Session
      </button>
    </div>
  );
}
