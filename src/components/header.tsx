"use client";

import { usePathname } from "next/navigation";
import { Button } from "./ui/button";
import { Plus, Wand2 } from "lucide-react";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/posts": "Posts",
  "/templates": "Templates",
  "/generate": "Generate Templates",
  "/analytics": "Analytics",
  "/accounts": "Accounts",
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        {pathname === "/posts" && (
          <Link href="/posts?import=true">
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Import Post
            </Button>
          </Link>
        )}
        {pathname === "/templates" && (
          <Link href="/generate">
            <Button size="sm">
              <Wand2 className="h-4 w-4 mr-1" />
              Generate Templates
            </Button>
          </Link>
        )}
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
          TY
        </div>
      </div>
    </header>
  );
}
