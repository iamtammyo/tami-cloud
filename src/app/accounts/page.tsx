"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PlatformIcon, getPlatformName } from "@/components/platform-icon";
import { mockAccounts } from "@/lib/mock-data";
import { Plus, ExternalLink, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import type { Platform } from "@/types";

const availablePlatforms: { platform: Platform; description: string; scopes: string }[] = [
  {
    platform: "twitter",
    description: "Connect your X/Twitter account to import tweets and engagement data",
    scopes: "tweet.read, users.read",
  },
  {
    platform: "instagram",
    description: "Connect your Instagram Business account to import posts and insights",
    scopes: "instagram_basic, instagram_manage_insights",
  },
  {
    platform: "linkedin",
    description: "Connect your LinkedIn profile to import posts and analytics",
    scopes: "r_liteprofile, r_member_social",
  },
];

export default function AccountsPage() {
  const connectedProviders = mockAccounts.map((a) => a.provider);

  return (
    <div className="space-y-8">
      {/* Connected Accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {mockAccounts.map((account) => (
            <Card key={account.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <PlatformIcon platform={account.provider} size="lg" />
                    <div>
                      <p className="font-medium">{account.username}</p>
                      <p className="text-sm text-muted-foreground">{getPlatformName(account.provider)}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1">
                    <RefreshCw className="h-3.5 w-3.5 mr-1" />
                    Sync Posts
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Available Connections */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Add Platform</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {availablePlatforms
            .filter((p) => !connectedProviders.includes(p.platform))
            .map((item) => (
              <Card key={item.platform} className="border-dashed">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <PlatformIcon platform={item.platform} size="lg" />
                    <div>
                      <p className="font-medium">{getPlatformName(item.platform)}</p>
                      <p className="text-xs text-muted-foreground">Scopes: {item.scopes}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <Button size="sm" className="w-full">
                    <Plus className="h-4 w-4 mr-1" />
                    Connect {getPlatformName(item.platform)}
                  </Button>
                </CardContent>
              </Card>
            ))}

          {connectedProviders.length === availablePlatforms.length && (
            <Card className="border-dashed">
              <CardContent className="p-4 flex items-center justify-center h-full">
                <p className="text-sm text-muted-foreground text-center">
                  All available platforms are connected!<br />
                  More platforms coming soon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setting Up API Connections</CardTitle>
          <CardDescription>
            To connect real social media accounts, you&apos;ll need to configure API keys for each platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">1. Create a .env.local file</h4>
              <p className="text-muted-foreground">Add your API credentials to the .env.local file in the project root.</p>
              <pre className="mt-2 p-3 bg-background rounded border text-xs font-mono overflow-x-auto">
{`AUTH_SECRET=your-auth-secret-here
AUTH_TWITTER_ID=your-twitter-client-id
AUTH_TWITTER_SECRET=your-twitter-client-secret
AUTH_INSTAGRAM_ID=your-instagram-app-id
AUTH_INSTAGRAM_SECRET=your-instagram-app-secret
AUTH_LINKEDIN_ID=your-linkedin-client-id
AUTH_LINKEDIN_SECRET=your-linkedin-client-secret
ANTHROPIC_API_KEY=your-anthropic-api-key`}
              </pre>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">2. Register Developer Apps</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>• <strong>X/Twitter</strong>: Create an app at developer.x.com with OAuth 2.0</p>
                <p>• <strong>Instagram</strong>: Set up a Facebook App with Instagram Graph API access</p>
                <p>• <strong>LinkedIn</strong>: Register at linkedin.com/developers</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-1">3. Set Callback URLs</h4>
              <p className="text-muted-foreground">
                Point each platform&apos;s OAuth callback to: <code className="bg-background px-1 rounded">http://localhost:3000/api/auth/callback/[provider]</code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
