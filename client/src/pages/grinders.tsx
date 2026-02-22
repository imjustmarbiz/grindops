import { useGrinders } from "@/hooks/use-grinders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Crown, AlertTriangle, Trophy } from "lucide-react";

export default function Grinders() {
  const { data: grinders, isLoading } = useGrinders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-grinders-title">
            <Users className="w-8 h-8 text-primary" /> Grinder Roster
          </h1>
          <p className="text-muted-foreground mt-1">Grinders auto-imported from MGT Bot proposals.</p>
        </div>
      </div>

      <Card className="glass-panel border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>Grinder</TableHead>
              <TableHead>Discord</TableHead>
              <TableHead className="text-center">Tier</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-center">Reviews</TableHead>
              <TableHead className="text-center">Win Rate</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">Strikes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : grinders && grinders.length > 0 ? grinders.map(grinder => {
              const winRateNum = grinder.winRate ? Number(grinder.winRate) * 100 : null;
              return (
                <TableRow key={grinder.id} className="hover:bg-white/[0.02]" data-testid={`row-grinder-${grinder.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {grinder.tier === 'Elite' ? <Crown className="w-4 h-4 text-yellow-500" /> : <Users className="w-4 h-4 text-primary" />}
                      <span className="font-medium text-foreground" data-testid={`text-grinder-name-${grinder.id}`}>{grinder.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground" data-testid={`text-discord-${grinder.id}`}>
                    {grinder.discordUsername ? `@${grinder.discordUsername}` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={`text-[10px] h-5 ${
                      grinder.tier === 'Elite' ? 'border-yellow-500/30 text-yellow-500' :
                      grinder.tier === 'New' ? 'border-green-500/30 text-green-400' :
                      'border-primary/30 text-primary'
                    }`} data-testid={`badge-tier-${grinder.id}`}>
                      {grinder.tier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium" data-testid={`text-orders-${grinder.id}`}>
                    {grinder.totalOrders}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground" data-testid={`text-reviews-${grinder.id}`}>
                    {grinder.totalReviews}
                  </TableCell>
                  <TableCell className="text-center">
                    {winRateNum !== null ? (
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-3 h-3 text-yellow-500" />
                        <span className={`font-medium ${winRateNum >= 70 ? 'text-green-400' : winRateNum >= 40 ? 'text-yellow-400' : 'text-red-400'}`} data-testid={`text-winrate-${grinder.id}`}>
                          {winRateNum.toFixed(0)}%
                        </span>
                      </div>
                    ) : <span className="text-muted-foreground">N/A</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={Number(grinder.activeOrders) > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                      {grinder.activeOrders}/{grinder.capacity}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {grinder.strikes > 0 ? (
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
                        <AlertTriangle className="w-3 h-3" /> {grinder.strikes}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                  No grinders yet. Grinder profiles are auto-created when they submit proposals via MGT Bot.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
