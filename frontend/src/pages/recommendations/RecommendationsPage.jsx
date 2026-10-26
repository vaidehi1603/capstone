import React, { useState, useEffect } from 'react';
import { recommendationService } from '../../services/recommendationService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { Sparkles, Server, Filter, CheckCircle2, TrendingDown } from 'lucide-react';

export const RecommendationsPage = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const loadData = async () => {
    setLoading(true);
    try {
      const recData = await recommendationService.getRecommendations();
      setRecommendations(recData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRecs = recommendations.filter((r) => {
    if (selectedPriority !== 'ALL' && r.priority !== selectedPriority) return false;
    if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
    return true;
  });

  const categories = Array.from(new Set(recommendations.map((r) => r.category))).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Prescriptive Sustainability Recommendations
            </h1>
            <Badge variant="emerald">VESIT Decarbonization Advisory</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data-backed interventions customized to campus infrastructure, high-tonnage HVAC systems, and student facilities.
          </p>
        </div>
        <button
          onClick={loadData}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Refresh Advisory
        </button>
      </div>

      {/* Filter Bar */}
      <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
          >
            <option value="ALL">All Priorities</option>
            <option value="HIGH">High Priority</option>
            <option value="MEDIUM">Medium Priority</option>
            <option value="LOW">Low Priority</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
          Showing {filteredRecs.length} of {recommendations.length} Actionable Recommendations
        </span>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Synthesizing Campus Decarbonization Recommendations..." className="min-h-[40vh]" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRecs.map((rec) => (
            <div
              key={rec.id}
              className={`card-surface card-surface-hover p-5 flex flex-col justify-between transition-all ${
                rec.priority === 'HIGH'
                  ? 'border-l-4 border-l-rose-500'
                  : rec.priority === 'MEDIUM'
                  ? 'border-l-4 border-l-amber-500'
                  : 'border-l-4 border-l-emerald-500'
              }`}
            >
              <div>
                {/* Card Top Row */}
                <div className="flex items-center justify-between mb-3">
                  <Badge
                    variant={
                      rec.priority === 'HIGH' ? 'rose' : rec.priority === 'MEDIUM' ? 'amber' : 'emerald'
                    }
                  >
                    {rec.priority} Priority
                  </Badge>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    {rec.category}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {rec.title}
                </h3>

                {/* Problem Identified (Reason) */}
                <div className="mb-3">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider mb-1 font-mono">
                    Data Rationale:
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                    {rec.reason}
                  </p>
                </div>

                {/* Recommended Suggestion */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 mb-4">
                  <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recommended Action:
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed">
                    {rec.action}
                  </p>
                </div>
              </div>

              {/* Card Footer: Source */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Server className="w-3.5 h-3.5" />
                  <span className="font-semibold text-[10px] uppercase font-mono">Algorithm / Engine:</span>
                </div>
                <div className="font-mono font-bold text-[11px] text-emerald-700 dark:text-emerald-400">
                  {rec.source}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
