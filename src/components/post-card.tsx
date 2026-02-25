"use client";

import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { PlatformIcon } from "./platform-icon";
import { formatNumber, formatDate } from "@/lib/mock-data";
import { Heart, MessageCircle, Repeat2, Eye, TrendingUp } from "lucide-react";
import type { Post } from "@/types";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: Post;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function PostCard({ post, selectable = false, selected = false, onSelect }: PostCardProps) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        selectable && "cursor-pointer",
        selected && "ring-2 ring-primary"
      )}
      onClick={() => selectable && onSelect?.(post.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {selectable && (
            <div className="pt-1">
              <Checkbox checked={selected} onCheckedChange={() => onSelect?.(post.id)} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PlatformIcon platform={post.platform} size="sm" />
                <span className="text-sm text-muted-foreground">{post.accountUsername}</span>
              </div>
              <div className="flex items-center gap-2">
                {post.isTopPerformer && (
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Top Performer
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">{formatDate(post.publishedAt)}</span>
              </div>
            </div>

            {/* Content */}
            <p className="text-sm whitespace-pre-line line-clamp-4 mb-3">{post.content}</p>

            {/* Metrics */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Heart className="h-3.5 w-3.5" />
                {formatNumber(post.likes)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3.5 w-3.5" />
                {formatNumber(post.comments)}
              </span>
              <span className="flex items-center gap-1">
                <Repeat2 className="h-3.5 w-3.5" />
                {formatNumber(post.shares)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                {formatNumber(post.impressions)}
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                {post.engagementRate}% eng
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
