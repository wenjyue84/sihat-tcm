"use client";

import { motion } from "framer-motion";

interface AnalysisTag {
  title: string;
  title_cn?: string;
  category: string;
  confidence: number;
  description: string;
  recommendations: string[];
}

interface AnalysisTagsDisplayProps {
  tags: AnalysisTag[];
  className?: string;
}

export function AnalysisTagsDisplay({ tags, className = "" }: AnalysisTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-emerald-800 flex items-center gap-2">
        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        Analysis Tags
      </h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tags.map((tag, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 shadow-lg border border-slate-700/50"
          >
            {/* Header with Title and Confidence */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-semibold text-white text-base">
                  {tag.title}
                  {tag.title_cn && (
                    <span className="ml-1 text-slate-400 text-sm font-normal">
                      ({tag.title_cn})
                    </span>
                  )}
                </h4>
                <p className="text-xs text-emerald-400 mt-0.5">{tag.category}</p>
              </div>
              <span className="text-emerald-400 font-bold text-lg">
                {tag.confidence.toFixed(1)}%
              </span>
            </div>

            {/* Confidence Bar */}
            <div className="w-full bg-slate-700 rounded-full h-1.5 mb-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tag.confidence}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              />
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed mb-3">{tag.description}</p>

            {/* Recommendations */}
            {tag.recommendations && tag.recommendations.length > 0 && (
              <ul className="space-y-1.5">
                {tag.recommendations.map((rec, recIndex) => (
                  <li key={recIndex} className="flex items-start gap-2 text-sm text-slate-400">
                    <span className="text-emerald-500 mt-1">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// Compact version for inline display within other components
export function AnalysisTagsCompact({ tags, className = "" }: AnalysisTagsDisplayProps) {
  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {tags.map((tag, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-emerald-50 border border-emerald-100 rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-emerald-900 text-sm">{tag.title}</span>
              {tag.title_cn && <span className="text-emerald-600 text-xs">{tag.title_cn}</span>}
            </div>
            <span className="text-emerald-600 font-semibold text-sm">
              {tag.confidence.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-emerald-100 rounded-full h-1 mb-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${tag.confidence}%` }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="h-full rounded-full bg-emerald-500"
            />
          </div>

          <p className="text-xs text-emerald-700 mb-2 italic">{tag.category}</p>

          <p className="text-sm text-emerald-800 leading-relaxed">{tag.description}</p>

          {tag.recommendations && tag.recommendations.length > 0 && (
            <ul className="mt-2 space-y-1">
              {tag.recommendations.map((rec, recIndex) => (
                <li key={recIndex} className="flex items-start gap-1.5 text-xs text-emerald-700">
                  <span className="text-emerald-500">→</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      ))}
    </div>
  );
}
