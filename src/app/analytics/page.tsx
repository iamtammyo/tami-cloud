"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPosts, formatNumber } from "@/lib/mock-data";
import { PlatformIcon } from "@/components/platform-icon";
import { TrendingUp, TrendingDown, BarChart3, Eye, Heart, MessageCircle } from "lucide-react";
import type { Platform } from "@/types";

export default function AnalyticsPage() {
  const platforms: Platform[] = ["twitter", "instagram", "linkedin"];

  const totalImpressions = mockPosts.reduce((s, p) => s + p.impressions, 0);
  const totalLikes = mockPosts.reduce((s, p) => s + p.likes, 0);
  const totalComments = mockPosts.reduce((s, p) => s + p.comments, 0);
  const totalShares = mockPosts.reduce((s, p) => s + p.shares, 0);
  const avgEngagement = (mockPosts.reduce((s, p) => s + p.engagementRate, 0) / mockPosts.length).toFixed(1);

  const platformStats = platforms.map((platform) => {
    const posts = mockPosts.filter((p) => p.platform === platform);
    if (posts.length === 0) return null;
    return {
      platform,
      posts: posts.length,
      impressions: posts.reduce((s, p) => s + p.impressions, 0),
      likes: posts.reduce((s, p) => s + p.likes, 0),
      comments: posts.reduce((s, p) => s + p.comments, 0),
      shares: posts.reduce((s, p) => s + p.shares, 0),
      avgEngagement: (posts.reduce((s, p) => s + p.engagementRate, 0) / posts.length).toFixed(1),
      topPost: posts.sort((a, b) => b.engagementRate - a.engagementRate)[0],
    };
  }).filter(Boolean);

  // Engagement distribution
  const engagementRanges = [
    { label: "0-3%", min: 0, max: 3 },
    { label: "3-5%", min: 3, max: 5 },
    { label: "5-8%", min: 5, max: 8 },
    { label: "8-10%", min: 8, max: 10 },
    { label: "10%+", min: 10, max: 100 },
  ];

  const distribution = engagementRanges.map((range) => ({
    ...range,
    count: mockPosts.filter((p) => p.engagementRate >= range.min && p.engagementRate < range.max).length,
  }));

  const maxCount = Math.max(...distribution.map((d) => d.count));

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impressions</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalImpressions)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Likes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalLikes)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalComments)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalShares)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Engagement Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribution.map((range) => (
                <div key={range.label} className="flex items-center gap-3">
                  <span className="text-sm w-12 text-right text-muted-foreground">{range.label}</span>
                  <div className="flex-1 h-8 bg-muted rounded-md overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-md transition-all duration-500 flex items-center px-2"
                      style={{ width: `${maxCount > 0 ? (range.count / maxCount) * 100 : 0}%` }}
                    >
                      {range.count > 0 && (
                        <span className="text-xs text-primary-foreground font-medium">{range.count}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {platformStats.map((stat) => {
                if (!stat) return null;
                return (
                  <div key={stat.platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <PlatformIcon platform={stat.platform} showLabel />
                      <span className="text-sm font-medium">{stat.avgEngagement}% avg eng</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-sm font-medium">{stat.posts}</div>
                        <div className="text-xs text-muted-foreground">Posts</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-sm font-medium">{formatNumber(stat.likes)}</div>
                        <div className="text-xs text-muted-foreground">Likes</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-sm font-medium">{formatNumber(stat.comments)}</div>
                        <div className="text-xs text-muted-foreground">Comments</div>
                      </div>
                      <div className="p-2 rounded bg-muted/50">
                        <div className="text-sm font-medium">{formatNumber(stat.impressions)}</div>
                        <div className="text-xs text-muted-foreground">Impressions</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Posts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Platform</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Content</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Likes</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Comments</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Impressions</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {[...mockPosts]
                  .sort((a, b) => b.engagementRate - a.engagementRate)
                  .slice(0, 10)
                  .map((post) => (
                    <tr key={post.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <PlatformIcon platform={post.platform} size="sm" />
                      </td>
                      <td className="py-3 px-2 max-w-xs truncate">{post.content.slice(0, 80)}...</td>
                      <td className="py-3 px-2 text-right">{formatNumber(post.likes)}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(post.comments)}</td>
                      <td className="py-3 px-2 text-right">{formatNumber(post.impressions)}</td>
                      <td className="py-3 px-2 text-right font-medium">{post.engagementRate}%</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
