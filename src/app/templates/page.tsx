"use client";

import { useState } from "react";
import { TemplateCard } from "@/components/template-card";
import { mockTemplates } from "@/lib/mock-data";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Wand2, Plus } from "lucide-react";
import type { Template } from "@/types";
import Link from "next/link";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editName, setEditName] = useState("");

  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category).filter(Boolean)))];

  let filtered = [...templates];
  if (categoryFilter !== "all") {
    filtered = filtered.filter((t) => t.category === categoryFilter);
  }
  if (searchQuery) {
    filtered = filtered.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setEditName(template.name);
    setEditContent(template.content);
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    setTemplates(
      templates.map((t) =>
        t.id === editingTemplate.id ? { ...t, name: editName, content: editContent, updatedAt: new Date().toISOString() } : t
      )
    );
    setEditingTemplate(null);
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const handleUse = (template: Template) => {
    navigator.clipboard.writeText(template.content);
    setTemplates(
      templates.map((t) =>
        t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t
      )
    );
    alert("Template copied to clipboard! Paste it into your social media composer.");
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Link href="/generate">
          <Button size="sm">
            <Wand2 className="h-4 w-4 mr-1" />
            Generate New
          </Button>
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} template{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Templates Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onUse={handleUse}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Wand2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No templates yet</h3>
          <p className="text-muted-foreground mb-4">
            Generate your first templates by analyzing your top-performing posts.
          </p>
          <Link href="/generate">
            <Button>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Templates
            </Button>
          </Link>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Name</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Template Content</label>
              <Textarea
                rows={8}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use [brackets] for placeholders, e.g. [topic], [statistic]
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
