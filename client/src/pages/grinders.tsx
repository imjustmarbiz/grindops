import { useGrinders } from "@/hooks/use-grinders";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Users, Crown, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function Grinders() {
  const { data: grinders, isLoading } = useGrinders();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" /> Roster
          </h1>
          <p className="text-muted-foreground mt-1">Manage and track your active grinders.</p>
        </div>
      </div>

      <Card className="glass-panel border-border/50 overflow-hidden">
        <Table>
          <TableHeader className="bg-white/5">
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name & Tier</TableHead>
              <TableHead className="text-center">Capacity</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-center">Util %</TableHead>
              <TableHead>Last Assigned</TableHead>
              <TableHead className="text-center">Strikes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center h-24">Loading...</TableCell></TableRow>
            ) : grinders?.map(grinder => (
              <TableRow key={grinder.id} className="hover:bg-white/[0.02]">
                <TableCell className="font-mono text-sm text-muted-foreground">{grinder.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {grinder.tier === 'Elite' ? <Crown className="w-4 h-4 text-yellow-500" /> : <Users className="w-4 h-4 text-primary" />}
                    <span className="font-medium text-foreground">{grinder.name}</span>
                    <Badge variant="outline" className={`text-[10px] h-4 ${grinder.tier === 'Elite' ? 'border-yellow-500/30 text-yellow-500' : 'border-primary/30 text-primary'}`}>
                      {grinder.tier}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center font-medium">{grinder.capacity}</TableCell>
                <TableCell className="text-center">
                  <span className={Number(grinder.activeOrders) > 0 ? "text-primary font-bold" : "text-muted-foreground"}>
                    {grinder.activeOrders}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all" 
                        style={{ width: `${Math.min(100, Number(grinder.utilization) * 100)}%` }} 
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8">
                      {(Number(grinder.utilization) * 100).toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {grinder.lastAssigned ? format(new Date(grinder.lastAssigned), "MMM d, yyyy") : "Never"}
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
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
