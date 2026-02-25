"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { PlatformIcon } from "./platform-icon";
import type { Template } from "@/types";
import { Copy, Edit3, Trash2, Wand2, Hash } from "lucide-react";
import { useState } from "react";

interface TemplateCardProps {
  template: Template;
  onEdit?: (template: Template) => void;
  onDelete?: (id: string) => void;
  onUse?: (template: Template) => void;
}

const categoryColors: Record<string, string> = {
  hook: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  story: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  engagement: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  educational: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  promotional: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  cta: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

export function TemplateCard({ template, onEdit, onDelete, onUse }: TemplateCardProps) {
  const [expanded, setExpanded] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(template.content);
  };

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-base">{template.name}</CardTitle>
              {template.isAiGenerated && (
                <Wand2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {template.platform && (
              <PlatformIcon platform={template.platform} size="sm" />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          {template.category && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[template.category] || "bg-gray-100 text-gray-800"}`}>
              {template.category}
            </span>
          )}
          {template.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              <Hash className="h-2.5 w-2.5 mr-0.5" />
              {tag}
            </Badge>
          ))}
          <span className="text-xs text-muted-foreground ml-auto">
            Used {template.usageCount}x
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="bg-muted/50 rounded-lg p-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <pre className={`text-sm whitespace-pre-wrap font-sans ${expanded ? "" : "line-clamp-4"}`}>
            {template.content}
          </pre>
          {!expanded && (
            <p className="text-xs text-muted-foreground mt-1">Click to expand</p>
          )}
        </div>

        {expanded && template.explanation && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">Why this works:</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">{template.explanation}</p>
          </div>
        )}

        {expanded && template.placeholders && template.placeholders.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {template.placeholders.map((p) => (
              <span key={p} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                [{p}]
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" variant="outline" onClick={copyToClipboard}>
            <Copy className="h-3.5 w-3.5 mr-1" />
            Copy
          </Button>
          {onUse && (
            <Button size="sm" onClick={() => onUse(template)}>
              Use Template
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={() => onEdit(template)}>
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="ghost" className="text-destructive" onClick={() => onDelete(template.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
