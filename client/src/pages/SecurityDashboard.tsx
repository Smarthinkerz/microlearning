import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Shield, AlertTriangle, Globe, FileCheck, Activity,
  Plus, Trash2, Loader2, RefreshCw, Eye, Clock,
  CheckCircle2, XCircle, AlertCircle, Info, Lock,
  ShieldAlert, ShieldCheck, ShieldOff, Network,
} from "lucide-react";

// ─── Severity & Status Helpers ──────────────────────────────────────
const severityConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  critical: { color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <ShieldAlert className="h-3.5 w-3.5" />, label: "Critical" },
  high: { color: "bg-orange-500/15 text-orange-400 border-orange-500/30", icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "High" },
  medium: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <AlertCircle className="h-3.5 w-3.5" />, label: "Medium" },
  low: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Info className="h-3.5 w-3.5" />, label: "Low" },
};

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  detected: { color: "bg-red-500/15 text-red-400 border-red-500/30", icon: <AlertTriangle className="h-3.5 w-3.5" />, label: "Detected" },
  investigating: { color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30", icon: <Eye className="h-3.5 w-3.5" />, label: "Investigating" },
  contained: { color: "bg-blue-500/15 text-blue-400 border-blue-500/30", icon: <Lock className="h-3.5 w-3.5" />, label: "Contained" },
  resolved: { color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30", icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: "Resolved" },
  false_positive: { color: "bg-gray-500/15 text-gray-400 border-gray-500/30", icon: <XCircle className="h-3.5 w-3.5" />, label: "False Positive" },
};

function formatDate(ts: number | string | Date | null | undefined): string {
  if (!ts) return "—";
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Summary Cards ──────────────────────────────────────────────────
function SummaryCards({
  breachStats,
  ipCount,
  consentRate,
}: {
  breachStats: any;
  ipCount: number;
  consentRate: number;
}) {
  const cards = [
    {
      title: "Breach Events",
      value: breachStats?.total ?? 0,
      subtitle: `${breachStats?.unnotified ?? 0} unnotified`,
      icon: <ShieldAlert className="h-5 w-5" />,
      color: (breachStats?.unnotified ?? 0) > 0 ? "text-red-400" : "text-emerald-400",
      bg: (breachStats?.unnotified ?? 0) > 0 ? "bg-red-500/10" : "bg-emerald-500/10",
    },
    {
      title: "Critical / High",
      value: (breachStats?.bySeverity?.critical ?? 0) + (breachStats?.bySeverity?.high ?? 0),
      subtitle: `${breachStats?.bySeverity?.critical ?? 0} critical, ${breachStats?.bySeverity?.high ?? 0} high`,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
    },
    {
      title: "Allowed IPs",
      value: ipCount,
      subtitle: ipCount === 0 ? "Open mode (all allowed)" : `${ipCount} IP${ipCount !== 1 ? "s" : ""} configured`,
      icon: <Network className="h-5 w-5" />,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Consent Compliance",
      value: `${consentRate}%`,
      subtitle: "Average consent grant rate",
      icon: <FileCheck className="h-5 w-5" />,
      color: consentRate >= 80 ? "text-emerald-400" : consentRate >= 50 ? "text-yellow-400" : "text-red-400",
      bg: consentRate >= 80 ? "bg-emerald-500/10" : consentRate >= 50 ? "bg-yellow-500/10" : "bg-red-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.subtitle}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${card.bg}`}>
                <span className={card.color}>{card.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Breach Events Tab ──────────────────────────────────────────────
function BreachEventsTab() {
  const { data: stats, isLoading: statsLoading } = trpc.breach.stats.useQuery();
  const { data: events, isLoading: eventsLoading, refetch } = trpc.breach.list.useQuery({ limit: 100 });
  const utils = trpc.useUtils();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const updateStatus = trpc.breach.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Breach status updated");
      utils.breach.list.invalidate();
      utils.breach.stats.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const filteredEvents = (events ?? []).filter((e: any) => {
    if (statusFilter !== "all" && e.status !== statusFilter) return false;
    if (severityFilter !== "all" && e.severity !== severityFilter) return false;
    return true;
  });

  if (statsLoading || eventsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Severity breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(stats?.bySeverity ?? {}).map(([sev, count]) => {
          const cfg = severityConfig[sev];
          return (
            <div key={sev} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${cfg?.color ?? ""}`}>
              {cfg?.icon}
              <span className="text-sm font-medium">{cfg?.label ?? sev}</span>
              <span className="ml-auto font-bold">{count as number}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-purple-500/15 text-purple-400 border-purple-500/30">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-sm font-medium">Unnotified</span>
          <span className="ml-auto font-bold">{stats?.unnotified ?? 0}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="detected">Detected</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="contained">Contained</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="false_positive">False Positive</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter by severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Events list */}
      <ScrollArea className="h-[420px]">
        <div className="space-y-2">
          {filteredEvents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No breach events found</p>
              <p className="text-sm">Your system is secure. No anomalies detected.</p>
            </div>
          ) : (
            filteredEvents.map((event: any) => {
              const sevCfg = severityConfig[event.severity] ?? severityConfig.low;
              const stsCfg = statusConfig[event.status] ?? statusConfig.detected;
              return (
                <Card key={event.id} className="border-border/50 hover:border-border transition-colors cursor-pointer" onClick={() => setSelectedEvent(event)}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-md mt-0.5 ${sevCfg.color}`}>{sevCfg.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm truncate">{event.description || event.eventType}</p>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${sevCfg.color}`}>{sevCfg.label}</Badge>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${stsCfg.color}`}>{stsCfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{formatDate(event.createdAt)}</span>
                          {event.sourceIp && <span>IP: {event.sourceIp}</span>}
                          {event.affectedUserCount > 0 && <span>{event.affectedUserCount} user{event.affectedUserCount !== 1 ? "s" : ""} affected</span>}
                          <span className="capitalize">{event.detectedBy}</span>
                        </div>
                      </div>
                      <Select
                        value={event.status}
                        onValueChange={(val) => {
                          updateStatus.mutate({ id: event.id, status: val as any });
                        }}
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="detected">Detected</SelectItem>
                          <SelectItem value="investigating">Investigating</SelectItem>
                          <SelectItem value="contained">Contained</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="false_positive">False Positive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Event detail dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Breach Event Details
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Event Type</p>
                  <p className="font-medium capitalize">{selectedEvent.eventType?.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Severity</p>
                  <Badge variant="outline" className={severityConfig[selectedEvent.severity]?.color}>{severityConfig[selectedEvent.severity]?.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <Badge variant="outline" className={statusConfig[selectedEvent.status]?.color}>{statusConfig[selectedEvent.status]?.label}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Detected By</p>
                  <p className="font-medium capitalize">{selectedEvent.detectedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Detected At</p>
                  <p className="font-medium">{formatDate(selectedEvent.createdAt)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Source IP</p>
                  <p className="font-medium font-mono text-xs">{selectedEvent.sourceIp || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Affected Users</p>
                  <p className="font-medium">{selectedEvent.affectedUserCount ?? 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Resource Type</p>
                  <p className="font-medium capitalize">{selectedEvent.affectedResourceType || "—"}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs mb-1">Description</p>
                <p className="text-sm">{selectedEvent.description || "No description provided."}</p>
              </div>
              {selectedEvent.metadata && Object.keys(selectedEvent.metadata).length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Metadata</p>
                  <pre className="text-xs bg-muted/50 p-3 rounded-lg overflow-auto max-h-32">{JSON.stringify(selectedEvent.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── IP Allowlist Tab ───────────────────────────────────────────────
function IpAllowlistTab() {
  const { data: entries, isLoading, refetch } = trpc.ipAllowlist.list.useQuery();
  const utils = trpc.useUtils();
  const [newIp, setNewIp] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCidr, setNewCidr] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const addIp = trpc.ipAllowlist.add.useMutation({
    onSuccess: () => {
      toast.success("IP added to allowlist");
      utils.ipAllowlist.list.invalidate();
      setNewIp("");
      setNewDesc("");
      setNewCidr("");
      setAddDialogOpen(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeIp = trpc.ipAllowlist.remove.useMutation({
    onSuccess: () => {
      toast.success("IP removed from allowlist");
      utils.ipAllowlist.list.invalidate();
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const activeCount = (entries ?? []).filter((e: any) => e.isActive).length;

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div className={`flex items-center gap-3 p-3 rounded-lg border ${activeCount === 0 ? "bg-yellow-500/10 border-yellow-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
        {activeCount === 0 ? (
          <>
            <ShieldOff className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-400">Open Mode — No IP Restrictions</p>
              <p className="text-xs text-muted-foreground">All IP addresses can access admin APIs. Add IPs to enable allowlisting.</p>
            </div>
          </>
        ) : (
          <>
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">IP Allowlist Active — {activeCount} IP{activeCount !== 1 ? "s" : ""} Allowed</p>
              <p className="text-xs text-muted-foreground">Only listed IPs can access admin API endpoints.</p>
            </div>
          </>
        )}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="ml-auto">
              <Plus className="h-4 w-4 mr-1" /> Add IP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add IP to Allowlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">IP Address</label>
                <Input placeholder="e.g. 192.168.1.100" value={newIp} onChange={(e) => setNewIp(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CIDR Range (optional)</label>
                <Input placeholder="e.g. /24" value={newCidr} onChange={(e) => setNewCidr(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <Input placeholder="e.g. Office network" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button
                onClick={() => addIp.mutate({ ip: newIp, cidr: newCidr || undefined, description: newDesc || undefined } as any)}
                disabled={!newIp || addIp.isPending}
              >
                {addIp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* IP list */}
      <ScrollArea className="h-[380px]">
        <div className="space-y-2">
          {(entries ?? []).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Globe className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No IPs configured</p>
              <p className="text-sm">Add IP addresses to restrict admin API access.</p>
            </div>
          ) : (
            (entries ?? []).map((entry: any) => (
              <Card key={entry.id} className="border-border/50">
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-md ${entry.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-gray-500/15 text-gray-400"}`}>
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-sm font-medium">{entry.ip}{entry.cidr ? entry.cidr : ""}</p>
                        <Badge variant="outline" className={entry.isActive ? "text-emerald-400 border-emerald-500/30" : "text-gray-400 border-gray-500/30"}>
                          {entry.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.description || "No description"}</p>
                    </div>
                    <Switch
                      checked={entry.isActive}
                      onCheckedChange={() => {
                        // Toggle active status - use remove with toggle
                        removeIp.mutate({ id: entry.id });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        if (confirm("Remove this IP from the allowlist?")) {
                          removeIp.mutate({ id: entry.id });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Consent Stats Tab ──────────────────────────────────────────────
function ConsentStatsTab() {
  const { data, isLoading } = trpc.consent.adminStats.useQuery();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  const consentLabels: Record<string, string> = {
    terms_of_service: "Terms of Service",
    privacy_policy: "Privacy Policy",
    marketing_emails: "Marketing Communications",
    analytics_tracking: "Analytics Tracking",
    data_processing: "Data Processing",
    third_party_sharing: "Third-Party Sharing",
  };

  const requiredTypes = ["terms_of_service", "privacy_policy", "data_processing"];

  return (
    <div className="space-y-4">
      {/* Overall compliance */}
      {data?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(data.stats).map(([type, stat]) => {
            const s = stat as { total: number; granted: number; rate: number };
            const isRequired = requiredTypes.includes(type);
            const rateColor = s.rate >= 80 ? "text-emerald-400" : s.rate >= 50 ? "text-yellow-400" : "text-red-400";
            const barColor = s.rate >= 80 ? "bg-emerald-500" : s.rate >= 50 ? "bg-yellow-500" : "bg-red-500";

            return (
              <Card key={type} className="border-border/50">
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium">{consentLabels[type] ?? type}</p>
                      {isRequired && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-1 text-amber-400 border-amber-500/30">Required</Badge>
                      )}
                    </div>
                    <span className={`text-lg font-bold ${rateColor}`}>{s.rate}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${s.rate}%` }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-xs text-muted-foreground">
                    <span>{s.granted} granted</span>
                    <span>{s.total} total</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {(!data?.stats || Object.keys(data.stats).length === 0) && (
        <div className="text-center py-12 text-muted-foreground">
          <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No consent data yet</p>
          <p className="text-sm">Consent statistics will appear once users start granting consents.</p>
        </div>
      )}

      {/* Info card */}
      <Card className="border-border/50 bg-muted/30">
        <CardContent className="py-3 px-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">GDPR Compliance Notes</p>
              <p>Required consents (Terms of Service, Privacy Policy, Data Processing) must be obtained before users can access the platform. Optional consents (Marketing, Analytics, Third-Party Sharing) can be managed by users in their privacy settings at any time.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────
export default function SecurityDashboard() {
  const { user } = useAuth();
  const { data: breachStats } = trpc.breach.stats.useQuery();
  const { data: ipEntries } = trpc.ipAllowlist.list.useQuery();
  const { data: consentData } = trpc.consent.adminStats.useQuery();

  // Calculate overall consent rate
  const consentRate = (() => {
    if (!consentData?.stats) return 0;
    const entries = Object.values(consentData.stats) as { rate: number }[];
    if (entries.length === 0) return 0;
    return Math.round(entries.reduce((sum, e) => sum + e.rate, 0) / entries.length);
  })();

  const ipCount = (ipEntries ?? []).filter((e: any) => e.isActive).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Security Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor breach events, manage IP allowlists, and track GDPR consent compliance.
          </p>
        </div>
        <Badge variant="outline" className="text-xs px-2 py-1">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Summary cards */}
      <SummaryCards breachStats={breachStats} ipCount={ipCount} consentRate={consentRate} />

      {/* Tabbed content */}
      <Tabs defaultValue="breaches" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="breaches" className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Breach Events</span>
            <span className="sm:hidden">Breaches</span>
          </TabsTrigger>
          <TabsTrigger value="allowlist" className="flex items-center gap-1.5">
            <Network className="h-4 w-4" />
            <span className="hidden sm:inline">IP Allowlist</span>
            <span className="sm:hidden">IPs</span>
          </TabsTrigger>
          <TabsTrigger value="consent" className="flex items-center gap-1.5">
            <FileCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Consent Stats</span>
            <span className="sm:hidden">Consent</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="breaches">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Breach Event Monitor</CardTitle>
              <CardDescription>Track and manage security incidents detected by the anomaly detection pipeline.</CardDescription>
            </CardHeader>
            <CardContent>
              <BreachEventsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allowlist">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">IP Allowlist Management</CardTitle>
              <CardDescription>Control which IP addresses can access admin API endpoints. CIDR ranges supported.</CardDescription>
            </CardHeader>
            <CardContent>
              <IpAllowlistTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="consent">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">GDPR Consent Compliance</CardTitle>
              <CardDescription>Aggregated consent grant rates across all users by consent type.</CardDescription>
            </CardHeader>
            <CardContent>
              <ConsentStatsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
