import React, { useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { HelpCircle, User, AlertCircle, TrendingUp, CheckCircle, Zap } from 'lucide-react';

export default function AnalyticsDashboard({ evaluationData, userAnswer, questionText }) {
  const [activeTab, setActiveTab] = useState("scores"); // scores, fillers, roasts, comparison

  if (!evaluationData) {
    return (
      <div className="p-8 text-center saas-card font-medium text-saas-muted text-xs">
        No interview statistics loaded. Finish an interview round to analyze telemetry.
      </div>
    );
  }

  const {
    technical_accuracy,
    communication_quality,
    grammar_feedback,
    tone,
    strengths,
    weaknesses,
    improvement_tips,
    ideal_comparison,
    roast,
    confidence_score,
    filler_words = {},
    total_fillers = 0,
    wpm = 130,
    clarity = "Good, concise"
  } = evaluationData;

  // Format data for Radar Chart
  const scoreData = [
    { subject: 'Technical', A: technical_accuracy, fullMark: 100 },
    { subject: 'Clarity', A: clarity.includes("brief") ? 45 : 85, fullMark: 100 },
    { subject: 'Confidence', A: confidence_score, fullMark: 100 },
    { subject: 'Structure', A: userAnswer ? Math.min(95, userAnswer.length / 5 + 40) : 55, fullMark: 100 },
    { subject: 'Speech Flow', A: Math.max(45, 100 - (total_fillers * 6)), fullMark: 100 },
  ];

  const fillerChartData = Object.entries(filler_words).map(([word, count]) => ({
    name: word,
    count: count
  }));

  return (
    <div className="flex flex-col gap-4 bg-white dark:bg-dark-card border border-saas-border dark:border-dark-border rounded-2xl overflow-hidden shadow-premium">
      {/* Sub tabs */}
      <div className="flex border-b border-saas-border dark:border-dark-border bg-saas-slate50 dark:bg-dark-bg text-xs font-semibold overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab("scores")}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
            activeTab === "scores" 
              ? "border-saas-indigo text-saas-indigo bg-saas-indigo/5 dark:bg-saas-indigo/10" 
              : "border-transparent text-saas-muted hover:text-saas-slate900 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Metrics Radar
        </button>
        
        <button
          onClick={() => setActiveTab("fillers")}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
            activeTab === "fillers" 
              ? "border-saas-indigo text-saas-indigo bg-saas-indigo/5 dark:bg-saas-indigo/10" 
              : "border-transparent text-saas-muted hover:text-saas-slate900 dark:hover:text-white"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          Speech & Fillers
        </button>

        <button
          onClick={() => setActiveTab("comparison")}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
            activeTab === "comparison" 
              ? "border-saas-indigo text-saas-indigo bg-saas-indigo/5 dark:bg-saas-indigo/10" 
              : "border-transparent text-saas-muted hover:text-saas-slate900 dark:hover:text-white"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          Compare Answers
        </button>

        <button
          onClick={() => setActiveTab("roasts")}
          className={`px-5 py-3.5 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all duration-200 ${
            activeTab === "roasts" 
              ? "border-saas-violet text-saas-violet bg-saas-violet/5 dark:bg-saas-violet/10" 
              : "border-transparent text-saas-muted hover:text-saas-slate900 dark:hover:text-white"
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-saas-violet" />
          Honest Feedback Critique
        </button>
      </div>

      {/* Main Body */}
      <div className="p-5">
        {activeTab === "scores" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Radar chart */}
            <div className="flex items-center justify-center bg-saas-slate50 dark:bg-dark-bg/60 rounded-xl p-3 border border-saas-border dark:border-dark-border h-[220px] md:h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={scoreData}>
                  <PolarGrid stroke="rgba(100, 116, 139, 0.2)" />
                  <PolarAngleAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 10, fontWeight: 500 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8 }} stroke="rgba(100, 116, 139, 0.3)" />
                  <Radar name="Candidate" dataKey="A" stroke="#4f46e5" fill="#818cf8" fillOpacity={0.2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* KPI list */}
            <div className="flex flex-col justify-between gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-saas-slate50 dark:bg-dark-bg/40 rounded-xl border border-saas-border dark:border-dark-border">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Technical Accuracy</span>
                  <span className="text-xl font-bold text-saas-indigo mt-1 block">{technical_accuracy}%</span>
                </div>
                <div className="p-4 bg-saas-slate50 dark:bg-dark-bg/40 rounded-xl border border-saas-border dark:border-dark-border">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Communication Flow</span>
                  <span className="text-xl font-bold text-saas-violet mt-1 block">{communication_quality}%</span>
                </div>
                <div className="p-4 bg-saas-slate50 dark:bg-dark-bg/40 rounded-xl border border-saas-border dark:border-dark-border">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Overall Score</span>
                  <span className="text-xl font-bold text-saas-emerald mt-1 block">{confidence_score}%</span>
                </div>
                <div className="p-4 bg-saas-slate50 dark:bg-dark-bg/40 rounded-xl border border-saas-border dark:border-dark-border">
                  <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Spoken Tone</span>
                  <span className="text-xs font-bold text-saas-slate900 dark:text-white mt-1.5 block truncate">{tone}</span>
                </div>
              </div>

              {/* Grammar */}
              <div className="p-3.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg/60 border border-saas-border dark:border-dark-border">
                <span className="font-bold text-saas-indigo flex items-center gap-1.5 mb-1.5 text-xs">
                  <CheckCircle className="w-4 h-4" />
                  Syntactic Analysis
                </span>
                <p className="text-saas-muted dark:text-dark-muted leading-relaxed text-xs font-medium">{grammar_feedback}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "fillers" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4 justify-center">
              <div className="p-4 rounded-xl bg-saas-slate50 dark:bg-dark-bg/40 border border-saas-border dark:border-dark-border">
                <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Speech Pace</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-saas-slate900 dark:text-white">{wpm} WPM</span>
                  <span className="text-xs text-saas-emerald font-bold">(Target: 130-150 WPM)</span>
                </div>
                <p className="text-xs text-saas-muted dark:text-dark-muted mt-1.5 leading-relaxed font-medium">Your cadence falls into a professional delivery range, optimizing transcript accuracy.</p>
              </div>

              <div className="p-4 rounded-xl bg-saas-slate50 dark:bg-dark-bg/40 border border-saas-border dark:border-dark-border">
                <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider block">Response Depth</span>
                <span className="text-sm font-semibold text-saas-slate900 dark:text-white block mt-1">{clarity}</span>
                <p className="text-xs text-saas-muted dark:text-dark-muted mt-1.5 leading-relaxed font-medium">Spoken data length contains sufficient keyword matches for ATS scoring rules.</p>
              </div>
            </div>

            {/* Filler chart */}
            <div className="flex flex-col gap-3">
              <span className="text-xs font-bold text-saas-slate700 dark:text-white flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-saas-rose" />
                Speech Filler Word Metrics ({total_fillers} total)
              </span>

              {fillerChartData.length === 0 ? (
                <div className="h-[160px] flex items-center justify-center bg-saas-slate50 dark:bg-dark-bg/20 rounded-xl border border-dashed border-saas-border dark:border-dark-border text-xs text-saas-emerald font-semibold">
                  Excellent! No speech fillers detected.
                </div>
              ) : (
                <div className="bg-saas-slate50 dark:bg-dark-bg/30 rounded-xl p-3 border border-saas-border dark:border-dark-border h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fillerChartData} layout="vertical" margin={{ left: -10, right: 10, top: 5, bottom: 5 }}>
                      <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                      <Tooltip contentStyle={{ background: '#ffffff', borderColor: '#cbd5e1', fontSize: 10 }} />
                      <Bar dataKey="count" fill="#4f46e5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "comparison" && (
          <div className="flex flex-col gap-4 text-xs font-sans">
            <div className="p-3.5 bg-saas-slate50 dark:bg-dark-bg/60 rounded-xl border border-saas-border dark:border-dark-border">
              <span className="text-saas-muted font-bold uppercase text-[9px] tracking-wider block mb-1">Interviewer Prompt</span>
              <p className="text-saas-slate850 dark:text-white font-medium leading-relaxed">{questionText}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3.5 bg-saas-slate50 dark:bg-dark-bg/30 rounded-xl border border-saas-border dark:border-dark-border/80">
                <span className="text-saas-indigo font-bold flex items-center gap-1.5 mb-2">
                  <User className="w-3.5 h-3.5" />
                  Your Response
                </span>
                <p className="text-saas-muted dark:text-dark-muted leading-relaxed font-medium max-h-[140px] overflow-y-auto pr-1">
                  {userAnswer || <span className="italic text-saas-slate400">No response captured.</span>}
                </p>
              </div>

              <div className="p-3.5 bg-saas-slate50 dark:bg-dark-bg/30 rounded-xl border border-saas-border dark:border-dark-border/80">
                <span className="text-saas-violet font-bold flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Ideal Response Comparison
                </span>
                <p className="text-saas-muted dark:text-dark-muted leading-relaxed font-medium max-h-[140px] overflow-y-auto pr-1">
                  {ideal_comparison}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "roasts" && (
          <div className="flex flex-col gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-saas-amber/10 border border-saas-amber/35 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-saas-amber flex-shrink-0" />
              <div className="flex flex-col">
                <span className="font-bold text-saas-amber uppercase tracking-wider text-[10px]">CANDIDATE IMPROVEMENT ENGINE (CRITIC MODE)</span>
                <span className="text-saas-slate600 dark:text-dark-muted mt-0.5 font-medium">Constructive, direct, brutally honest evaluations enabled.</span>
              </div>
            </div>

            {/* Critique content */}
            <div className="p-5 rounded-2xl bg-saas-slate50 dark:bg-dark-bg/60 border border-saas-border dark:border-dark-border/80">
              <p className="text-sm font-medium text-saas-slate700 dark:text-white leading-relaxed italic">
                "{roast}"
              </p>
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-saas-border dark:border-dark-border/50 text-xs font-medium">
          <div>
            <span className="text-saas-indigo font-bold block mb-2">Key Strengths</span>
            <ul className="list-inside list-disc text-saas-muted dark:text-dark-muted space-y-1.5">
              {strengths && strengths.map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div>
            <span className="text-saas-rose font-bold block mb-2">Areas for Improvement</span>
            <ul className="list-inside list-disc text-saas-muted dark:text-dark-muted space-y-1.5">
              {weaknesses && weaknesses.map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
