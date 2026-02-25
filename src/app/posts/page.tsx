"use client";

import { useState } from "react";
import { PostCard } from "@/components/post-card";
import { mockPosts } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Search, SlidersHorizontal, Plus, X } from "lucide-react";
import type { Platform, Post } from "@/types";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function PostsPageContent() {
  const searchParams = useSearchParams();
  const showImport = searchParams.get("import") === "true";

  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("engagement");
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [importOpen, setImportOpen] = useState(showImport);
  const [importData, setImportData] = useState({ platform: "twitter" as Platform, content: "", likes: "", comments: "", shares: "", impressions: "" });

  let filteredPosts = [...mockPosts];

  if (platformFilter !== "all") {
    filteredPosts = filteredPosts.filter((p) => p.platform === platformFilter);
  }
  if (showTopOnly) {
    filteredPosts = filteredPosts.filter((p) => p.isTopPerformer);
  }
  if (searchQuery) {
    filteredPosts = filteredPosts.filter((p) =>
      p.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  filteredPosts.sort((a, b) => {
    if (sortBy === "engagement") return b.engagementRate - a.engagementRate;
    if (sortBy === "likes") return b.likes - a.likes;
    if (sortBy === "impressions") return b.impressions - a.impressions;
    if (sortBy === "date") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={platformFilter} onValueChange={setPlatformFilter}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="twitter">X / Twitter</TabsTrigger>
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[160px]">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="engagement">Engagement</SelectItem>
            <SelectItem value="likes">Likes</SelectItem>
            <SelectItem value="impressions">Impressions</SelectItem>
            <SelectItem value="date">Date</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showTopOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowTopOnly(!showTopOnly)}
        >
          Top Performers
        </Button>

        <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
          <Plus className="h-4 w-4 mr-1" />
          Import Post
        </Button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredPosts.length} of {mockPosts.length} posts
      </p>

      {/* Posts Grid */}
      <div className="space-y-3">
        {filteredPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No posts match your filters.</p>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Post Manually</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Platform</label>
              <Select value={importData.platform} onValueChange={(v) => setImportData({ ...importData, platform: v as Platform })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twitter">X / Twitter</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Post Content</label>
              <Textarea
                rows={5}
                placeholder="Paste your post content here..."
                value={importData.content}
                onChange={(e) => setImportData({ ...importData, content: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Likes</label>
                <Input type="number" placeholder="0" value={importData.likes} onChange={(e) => setImportData({ ...importData, likes: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Comments</label>
                <Input type="number" placeholder="0" value={importData.comments} onChange={(e) => setImportData({ ...importData, comments: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Shares</label>
                <Input type="number" placeholder="0" value={importData.shares} onChange={(e) => setImportData({ ...importData, shares: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Impressions</label>
                <Input type="number" placeholder="0" value={importData.impressions} onChange={(e) => setImportData({ ...importData, impressions: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              alert("Post imported! (In the full version, this saves to the database)");
              setImportOpen(false);
            }}>Import Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PostsPageContent />
    </Suspense>
  );
}
