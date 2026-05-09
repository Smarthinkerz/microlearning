import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, Search, Filter, Clock, User, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  createdAt: Date;
  userName?: string;
}

export function AuditLogTab() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: logs, isLoading, refetch } = (trpc.crm as any).getAuditLogs?.useQuery({
    search: search || undefined,
    action: actionFilter !== "all" ? actionFilter : undefined,
    dateFrom: dateFrom ? new Date(dateFrom).toISOString() : undefined,
    dateTo: dateTo ? new Date(dateTo).toISOString() : undefined,
  });

  const exportLogs = ((trpc.crm as any).exportAuditLogs?.useMutation || { mutate: () => {}, isPending: false })({
    onSuccess: (data: any) => {
      // Create CSV download
      const csv = data.csv;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Audit logs exported successfully");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const actionColors: Record<string, string> = {
    user_created: "bg-green-500/10 text-green-400 border-green-500/30",
    user_updated: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    user_deleted: "bg-red-500/10 text-red-400 border-red-500/30",
    user_approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    user_blocked: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    payment_processed: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    lesson_created: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    lesson_assigned: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    email_sent: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Search (User/Resource)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label>Action Type</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="user_created">User Created</SelectItem>
                  <SelectItem value="user_updated">User Updated</SelectItem>
                  <SelectItem value="user_deleted">User Deleted</SelectItem>
                  <SelectItem value="user_approved">User Approved</SelectItem>
                  <SelectItem value="user_blocked">User Blocked</SelectItem>
                  <SelectItem value="payment_processed">Payment Processed</SelectItem>
                  <SelectItem value="lesson_created">Lesson Created</SelectItem>
                  <SelectItem value="lesson_assigned">Lesson Assigned</SelectItem>
                  <SelectItem value="email_sent">Email Sent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} variant="outline" className="flex-1">
              Apply Filters
            </Button>
            <Button
              onClick={() => exportLogs.mutate({ search, action: actionFilter !== "all" ? actionFilter : undefined, dateFrom, dateTo })}
              disabled={exportLogs.isPending || !logs?.length}
              className="flex-1"
            >
              {exportLogs.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Audit Logs ({logs?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-semibold">Timestamp</th>
                    <th className="text-left py-2 px-2 font-semibold">User</th>
                    <th className="text-left py-2 px-2 font-semibold">Action</th>
                    <th className="text-left py-2 px-2 font-semibold">Resource</th>
                    <th className="text-left py-2 px-2 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log: AuditLog) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{log.userName || `User #${log.userId}`}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <Badge className={`text-xs ${actionColors[log.action] || "bg-gray-500/10 text-gray-400 border-gray-500/30"}`}>
                          {log.action.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs">{log.resource} {log.resourceId ? `#${log.resourceId}` : ""}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {log.details ? (
                          <details className="cursor-pointer">
                            <summary className="text-xs text-primary hover:underline">View</summary>
                            <pre className="mt-2 bg-muted p-2 rounded text-xs overflow-auto max-h-32">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No audit logs found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
