"use client";

import type { ExtractedContent } from "@/types";

export default function SourceSummary({
  content,
}: {
  content: ExtractedContent;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-blue-600 transition-colors"
          >
            {content.title}
          </a>
        </h2>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
          {content.author && <span>By {content.author}</span>}
          {content.lastUpdated && (
            <span>
              {new Date(content.lastUpdated).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {content.topInsights.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Key Insights
          </h3>
          <ul className="space-y-1.5">
            {content.topInsights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.dataPoints.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Data Points
          </h3>
          <ul className="space-y-1.5">
            {content.dataPoints.map((dp, i) => (
              <li key={i} className="text-sm text-gray-600 leading-relaxed">
                {dp}
              </li>
            ))}
          </ul>
        </div>
      )}

      {content.quotableLines.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Quotable Lines
          </h3>
          <ul className="space-y-1.5">
            {content.quotableLines.slice(0, 5).map((quote, i) => (
              <li
                key={i}
                className="text-sm text-gray-600 italic leading-relaxed border-l-2 border-gray-200 pl-3"
              >
                {quote}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-xs text-gray-400">
        {content.sections.length} sections extracted
      </div>
    </div>
  );
}
