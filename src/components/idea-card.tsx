"use client";

import { useState } from "react";
import type { GeneratedIdea } from "@/types";

const IDEA_TYPE_LABELS: Record<string, string> = {
  "thought-leadership": "Thought Leadership",
  "data-callout": "Data Callout",
  "contrarian-take": "Contrarian Take",
  "heres-what-i-learned": "Here's What I Learned",
  "hot-take": "Hot Take",
  "quick-tip-thread": "Quick Tip Thread",
  "one-thing-surprised-me": "One Thing That Surprised Me",
  "insight-link": "Insight + Link",
  "mini-thread": "Mini-Thread",
  "community-question": "Community Question",
};

function getCharCountColor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 1) return "text-red-600";
  if (ratio > 0.9) return "text-amber-600";
  return "text-gray-500";
}

function getPlatformMaxChars(platform: string): number {
  switch (platform) {
    case "linkedin":
      return 3000;
    case "threads":
      return 500;
    case "bluesky":
      return 300;
    default:
      return 3000;
  }
}

export default function IdeaCard({
  idea,
  sourceTitle,
  onUpdate,
}: {
  idea: GeneratedIdea;
  sourceTitle: string;
  onUpdate: (updated: GeneratedIdea) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(
    idea.editedContent || idea.content
  );
  const [pushingBuffer, setPushingBuffer] = useState(false);
  const [pushingNotion, setPushingNotion] = useState(false);
  const [notionStatus, setNotionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const displayContent = idea.editedContent || idea.content;
  const maxChars = getPlatformMaxChars(idea.platform);

  const handleSaveEdit = () => {
    onUpdate({
      ...idea,
      edited: true,
      editedContent: editContent,
      characterCount: editContent.length,
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(displayContent);
    setIsEditing(false);
  };

  const handlePushToBuffer = async () => {
    setPushingBuffer(true);
    onUpdate({ ...idea, pushStatus: "pushing" });
    setStatusMessage(null);

    try {
      const res = await fetch("/api/buffer/push-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: {
            content: displayContent,
            sourceUrl: idea.sourceUrl,
            platform: idea.platform,
            ideaType: idea.ideaType,
            sourceTitle,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        onUpdate({
          ...idea,
          pushStatus: "pushed",
          bufferIdeaId: data.ideaId,
          pushError: null,
        });
        setStatusMessage("Pushed to Buffer");
      } else {
        onUpdate({
          ...idea,
          pushStatus: "error",
          pushError: data.error,
        });
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Push failed";
      onUpdate({ ...idea, pushStatus: "error", pushError: msg });
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setPushingBuffer(false);
    }
  };

  const handleLogToNotion = async () => {
    setPushingNotion(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/notion/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: { ...idea, editedContent: displayContent },
          sourceTitle,
          sourceUrl: idea.sourceUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setNotionStatus("success");
        setStatusMessage("Logged to Notion");
      } else {
        setNotionStatus("error");
        setStatusMessage(`Notion: ${data.error}`);
      }
    } catch (err) {
      setNotionStatus("error");
      const msg = err instanceof Error ? err.message : "Logging failed";
      setStatusMessage(`Notion: ${msg}`);
    } finally {
      setPushingNotion(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(displayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {IDEA_TYPE_LABELS[idea.ideaType] || idea.ideaType}
        </span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-mono ${getCharCountColor(displayContent.length, maxChars)}`}
          >
            {displayContent.length}/{maxChars}
          </span>
          {idea.pushStatus === "pushed" && (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Pushed
            </span>
          )}
          {idea.edited && (
            <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              Edited
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Save
            </button>
            <button
              onClick={handleCancelEdit}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-4 cursor-pointer hover:bg-gray-50 rounded p-2 -m-2 transition-colors"
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          {displayContent}
        </div>
      )}

      {!isEditing && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={handleCopy}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handlePushToBuffer}
            disabled={pushingBuffer || idea.pushStatus === "pushed"}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {pushingBuffer
              ? "Pushing..."
              : idea.pushStatus === "pushed"
                ? "Pushed"
                : "Push to Buffer"}
          </button>
          <button
            onClick={handleLogToNotion}
            disabled={pushingNotion || notionStatus === "success"}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pushingNotion
              ? "Logging..."
              : notionStatus === "success"
                ? "Logged"
                : "Log to Notion"}
          </button>
        </div>
      )}

      {statusMessage && (
        <div
          className={`mt-3 text-xs ${statusMessage.startsWith("Error") || statusMessage.startsWith("Notion:") ? "text-red-600" : "text-green-600"}`}
        >
          {statusMessage}
        </div>
      )}
    </div>
  );
}
