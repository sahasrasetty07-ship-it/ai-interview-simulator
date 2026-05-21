import React from 'react';
import { BookOpen, Briefcase, Award, Clock, ArrowUpRight } from 'lucide-react';

export default function RoadmapNode({ roadmapData }) {
  if (!roadmapData || !roadmapData.nodes) {
    return (
      <div className="p-8 text-center saas-card">
        <span className="text-saas-muted text-xs">Complete a mock interview round to generate a customized career learning path.</span>
      </div>
    );
  }

  const { nodes, recommended_certification, ready_score } = roadmapData;

  return (
    <div className="flex flex-col gap-6">
      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="saas-card p-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Candidate Readiness Rating</span>
            <span className="text-3xl font-extrabold text-saas-indigo mt-1.5">{ready_score}%</span>
            <span className="text-[11px] text-saas-muted mt-1">Based on ATS gaps and mock scores</span>
          </div>
          <div className="w-14 h-14 rounded-full border-4 border-saas-slate100 dark:border-saas-slate800 border-t-saas-indigo flex items-center justify-center font-bold text-sm text-saas-indigo font-mono animate-spin-slow">
            {ready_score}%
          </div>
        </div>

        <div className="saas-card p-5 flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-saas-indigo/10 text-saas-indigo border border-saas-indigo/25">
            <Award className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-saas-muted uppercase tracking-wider">Target Skills Credential</span>
            <span className="text-sm font-bold text-saas-slate900 dark:text-white mt-1">{recommended_certification}</span>
            <span className="text-[11px] text-saas-indigo font-semibold mt-1 flex items-center gap-0.5">
              Available upon roadmap completion
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Chronological Linear Timeline */}
      <div className="relative pl-6 md:pl-8 border-l-2 border-saas-slate200 dark:border-saas-slate800 flex flex-col gap-6 py-2">
        {nodes.map((node, index) => (
          <div key={node.id} className="relative">
            {/* Timeline Dot Indicator */}
            <div className={`absolute -left-[31px] md:-left-[39px] top-1.5 w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold z-10 ${
              index === 0 ? 'bg-saas-indigo text-white border-saas-indigo' :
              index === nodes.length - 1 ? 'bg-saas-violet text-white border-saas-violet' :
              'bg-white dark:bg-dark-card text-saas-muted border-saas-slate300 dark:border-dark-border'
            }`}>
              {node.id}
            </div>

            {/* Content card */}
            <div className="saas-card p-5 hover:border-saas-indigo/40 dark:hover:border-dark-muted/40 transition-all duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-saas-slate100 dark:border-dark-border pb-3.5 mb-4">
                <div className="flex flex-col">
                  <h4 className="text-sm font-bold text-saas-slate900 dark:text-white">
                    {node.title}
                  </h4>
                  <span className="text-xs text-saas-muted dark:text-dark-muted mt-1 leading-relaxed">{node.description}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-saas-slate100 dark:bg-saas-slate800 text-saas-muted dark:text-dark-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {node.duration}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                    node.difficulty === 'Easy' ? 'bg-saas-emerald/10 text-saas-emerald' :
                    node.difficulty === 'Medium' ? 'bg-saas-amber/10 text-saas-amber' :
                    'bg-saas-rose/10 text-saas-rose'
                  }`}>
                    {node.difficulty}
                  </span>
                </div>
              </div>

              {/* Study Resources & Projects */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                {/* Resources */}
                <div className="p-3.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg/40 border border-saas-border dark:border-dark-border/60">
                  <span className="text-saas-indigo dark:text-saas-indigo font-bold flex items-center gap-1.5 mb-2.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Recommended Study Resources
                  </span>
                  <ul className="list-inside list-disc text-saas-slate700 dark:text-dark-muted space-y-1.5 leading-relaxed font-medium">
                    {node.resources.map((res, idx) => (
                      <li key={idx}>{res}</li>
                    ))}
                  </ul>
                </div>

                {/* Projects */}
                <div className="p-3.5 rounded-xl bg-saas-slate50 dark:bg-dark-bg/40 border border-saas-border dark:border-dark-border/60">
                  <span className="text-saas-violet dark:text-saas-violet font-bold flex items-center gap-1.5 mb-2.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    Practical Milestones Projects
                  </span>
                  <ul className="list-inside list-disc text-saas-slate700 dark:text-dark-muted space-y-1.5 leading-relaxed font-medium">
                    {node.projects.map((proj, idx) => (
                      <li key={idx}>{proj}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
