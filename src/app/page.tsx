import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockPosts, mockTemplates, mockAccounts, formatNumber } from "@/lib/mock-data";
import { PlatformIcon } from "@/components/platform-icon";
import { FileText, Wand2, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import type { Platform } from "@/types";

export default function DashboardPage() {
  const totalPosts = mockPosts.length;
  const topPerformers = mockPosts.filter((p) => p.isTopPerformer).length;
  const totalTemplates = mockTemplates.length;
  const avgEngagement = (mockPosts.reduce((sum, p) => sum + p.engagementRate, 0) / mockPosts.length).toFixed(1);

  const recentPosts = mockPosts.slice(0, 5);
  const platformCounts = mockPosts.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">{topPerformers} top performers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <Wand2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTemplates}</div>
            <p className="text-xs text-muted-foreground">{mockTemplates.filter(t => t.isAiGenerated).length} AI-generated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Engagement</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgEngagement}%</div>
            <p className="text-xs text-muted-foreground">Across all platforms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockAccounts.length}</div>
            <p className="text-xs text-muted-foreground">Active platforms</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Top Posts */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Top Posts</CardTitle>
              <Link href="/posts" className="text-sm text-muted-foreground hover:text-foreground">
                View all →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <PlatformIcon platform={post.platform} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span>{formatNumber(post.likes)} likes</span>
                      <span>{formatNumber(post.comments)} comments</span>
                      <span>{post.engagementRate}% eng.</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(platformCounts).map(([platform, count]) => {
                const platformPosts = mockPosts.filter((p) => p.platform === platform);
                const avgEng = (platformPosts.reduce((s, p) => s + p.engagementRate, 0) / platformPosts.length).toFixed(1);
                const totalImpressions = platformPosts.reduce((s, p) => s + p.impressions, 0);
                return (
                  <div key={platform} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <PlatformIcon platform={platform as Platform} showLabel />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{count} posts</div>
                      <div className="text-xs text-muted-foreground">
                        {avgEng}% avg eng · {formatNumber(totalImpressions)} impressions
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/generate"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="text-sm">Generate Templates</span>
                </Link>
                <Link
                  href="/posts"
                  className="flex items-center gap-2 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  <span className="text-sm">View All Posts</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
