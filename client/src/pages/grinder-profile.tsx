import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, FileCheck, Gavel, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function GrinderProfile() {
  const { user } = useAuth();

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center" data-testid="text-no-profile">
        <AlertCircle className="w-16 h-16 text-muted-foreground" />
        <h2 className="text-2xl font-display font-bold">No Grinder Profile Found</h2>
        <p className="text-muted-foreground max-w-md">
          Your Discord account isn't linked to a grinder profile yet. Submit a bid through the MGT Bot to get started.
        </p>
      </div>
    );
  }

  const { grinder, assignments, bids, stats } = profile;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={user?.profileImageUrl || undefined} />
          <AvatarFallback className="bg-primary/20 text-primary text-2xl">
            {grinder.name?.charAt(0) || "G"}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-grinder-name">{grinder.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant="outline" className="border-primary/30 text-primary" data-testid="text-grinder-tier">
              {grinder.tier || "Standard"} Tier
            </Badge>
            <Badge 
              variant={grinder.status === "Available" ? "default" : "secondary"}
              className={grinder.status === "Available" ? "bg-green-500/20 text-green-400" : ""}
              data-testid="text-grinder-status"
            >
              {grinder.status || "Active"}
            </Badge>
            {grinder.platform && (
              <Badge variant="outline" className="text-muted-foreground" data-testid="text-grinder-platform">
                {grinder.platform}
              </Badge>
            )}
          </div>
          {grinder.gamertag && (
            <p className="text-sm text-muted-foreground mt-1" data-testid="text-grinder-gamertag">
              Gamertag: {grinder.gamertag}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-total-assignments">{stats.totalAssignments}</p>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-completed">{stats.completedAssignments}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-active">{stats.activeAssignments}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Gavel className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold" data-testid="text-stat-bids">{stats.totalBids}</p>
              <p className="text-xs text-muted-foreground">Total Bids</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileCheck className="w-5 h-5 text-primary" />
              My Assignments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">No assignments yet.</p>
            ) : (
              <div className="space-y-3">
                {assignments.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-assignment-${a.id}`}>
                    <div>
                      <p className="text-sm font-medium">Order {a.orderId}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.startDate ? new Date(a.startDate).toLocaleDateString() : "Not started"}
                      </p>
                    </div>
                    <Badge 
                      variant={a.status === "Active" ? "default" : a.status === "Completed" ? "secondary" : "outline"}
                      className={a.status === "Active" ? "bg-green-500/20 text-green-400" : a.status === "Completed" ? "bg-blue-500/20 text-blue-400" : ""}
                    >
                      {a.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="w-5 h-5 text-primary" />
              My Bids
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bids.length === 0 ? (
              <p className="text-muted-foreground text-sm">No bids yet.</p>
            ) : (
              <div className="space-y-3">
                {bids.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-bid-${b.id}`}>
                    <div>
                      <p className="text-sm font-medium">Order {b.orderId}</p>
                      <p className="text-xs text-muted-foreground">
                        Bid: ${b.bidAmount} &middot; {b.createdAt ? new Date(b.createdAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <Badge 
                      variant={b.status === "Pending" ? "outline" : b.status === "Accepted" ? "default" : "secondary"}
                      className={b.status === "Accepted" ? "bg-green-500/20 text-green-400" : b.status === "Denied" ? "bg-red-500/20 text-red-400" : ""}
                    >
                      {b.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {grinder.qualityScore != null && (
        <Card className="glass-panel border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Quality Score</p>
                <p className="text-xl font-bold" data-testid="text-quality-score">{grinder.qualityScore}/10</p>
              </div>
              {grinder.rating != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-xl font-bold" data-testid="text-rating">{grinder.rating}</p>
                </div>
              )}
              {grinder.maxConcurrent != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Max Concurrent</p>
                  <p className="text-xl font-bold" data-testid="text-max-concurrent">{grinder.maxConcurrent}</p>
                </div>
              )}
              {grinder.activeOrders != null && (
                <div>
                  <p className="text-sm text-muted-foreground">Active Orders</p>
                  <p className="text-xl font-bold" data-testid="text-active-orders">{grinder.activeOrders}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
