import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Activity, RefreshCw, Loader2, CheckCircle2, AlertTriangle,
  XCircle, HelpCircle, Clock, Zap, Server, Database,
  Mail, CreditCard, Brain, Mic,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";

// ─── Types ──────────────────────────────────────────────────────────
interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  latencyMs: number | null;
  lastChecked: number;
  message?: string;
}

interface SystemMetrics {
  uptime: number;
  totalRequests24h: number;
  errorRate24h: number;
  avgResponseTime: number;
}

// ─── Helpers ────────────────────────────────────────────────────────
function statusColor(status: string) {
  switch (status) {
    case "operational":
    case "all_operational":
    case "healthy":
      return "text-emerald-400";
    case "degraded":
      return "text-amber-400";
    case "down":
    case "partial_outage":
      return "text-red-400";
    default:
      return "text-muted-foreground";
  }
}

function statusBg(status: string) {
  switch (status) {
    case "operational":
      return "bg-emerald-500/10 border-emerald-500/20";
    case "degraded":
      return "bg-amber-500/10 border-amber-500/20";
    case "down":
      return "bg-red-500/10 border-red-500/20";
    default:
      return "bg-muted/30 border-border";
  }
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "operational":
      return <CheckCircle2 className="h-5 w-5 text-emerald-400" />;
    case "degraded":
      return <AlertTriangle className="h-5 w-5 text-amber-400" />;
    case "down":
      return <XCircle className="h-5 w-5 text-red-400" />;
    default:
      return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
  }
}

function ServiceIcon({ name }: { name: string }) {
  if (name.includes("Application")) return <Server className="h-4 w-4" />;
  if (name.includes("Database")) return <Database className="h-4 w-4" />;
  if (name.includes("Email") || name.includes("Resend")) return <Mail className="h-4 w-4" />;
  if (name.includes("Payment") || name.includes("Tap")) return <CreditCard className="h-4 w-4" />;
  if (name.includes("AI") || name.includes("LLM")) return <Brain className="h-4 w-4" />;
  if (name.includes("Voice") || name.includes("ElevenLabs")) return <Mic className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "N/A";
  if (ms < 1) return "<1ms";
  return `${ms}ms`;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// ─── Overall Status Banner ──────────────────────────────────────────
function OverallStatusBanner({ status }: { status: string }) {
  const labels: Record<string, string> = {
    all_operational: "All Systems Operational",
    degraded: "Some Systems Degraded",
    partial_outage: "Partial Outage Detected",
  };
  const label = labels[status] || "Status Unknown";

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border ${
        status === "all_operational"
          ? "bg-emerald-500/10 border-emerald-500/20"
          : status === "degraded"
            ? "bg-amber-500/10 border-amber-500/20"
            : status === "partial_outage"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-muted/30 border-border"
      }`}
    >
      <StatusIcon status={status === "all_operational" ? "operational" : status === "partial_outage" ? "down" : status} />
      <div>
        <p className={`font-semibold ${statusColor(status)}`}>{label}</p>
        <p className="text-xs text-muted-foreground">
          Real-time health monitoring of all platform services
        </p>
      </div>
    </div>
  );
}

// ─── Service Card ───────────────────────────────────────────────────
function ServiceCard({ service, onRefresh, refreshing }: {
  service: ServiceStatus;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${statusBg(service.status)}`}>
      <StatusIcon status={service.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <ServiceIcon name={service.name} />
          <span className="text-sm font-medium text-foreground">{service.name}</span>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 capitalize ${
              service.status === "operational"
                ? "border-emerald-500/30 text-emerald-400"
                : service.status === "degraded"
                  ? "border-amber-500/30 text-amber-400"
                  : service.status === "down"
                    ? "border-red-500/30 text-red-400"
                    : "border-border text-muted-foreground"
            }`}
          >
            {service.status}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {service.latencyMs !== null && (
            <span className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {formatLatency(service.latencyMs)}
            </span>
          )}
          {service.message && (
            <span className="truncate">{service.message}</span>
          )}
        </div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          Last checked: {formatTime(service.lastChecked)}
        </div>
      </div>
      {onRefresh && (
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 shrink-0"
          onClick={onRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </Button>
      )}
    </div>
  );
}

// ─── Main Status Page ───────────────────────────────────────────────
export default function SystemStatus() {
  const { data, isLoading, refetch, isFetching } = trpc.statusPage.fullStatus.useQuery(undefined, {
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const [refreshingService, setRefreshingService] = useState<string | null>(null);

  const checkService = trpc.statusPage.checkService.useMutation({
    onSuccess: () => {
      refetch();
      setRefreshingService(null);
    },
    onError: () => {
      setRefreshingService(null);
    },
  });

  // Map service names to service keys for individual refresh
  const serviceKeyMap: Record<string, string> = useMemo(() => ({
    "Application Server": "app",
    "Database (PostgreSQL)": "database",
    "Email Service (Resend)": "resend",
    "Payment Gateway (Tap)": "tap",
    "AI/LLM Service": "llm",
    "Voice Service (ElevenLabs)": "elevenlabs",
  }), []);

  function handleRefreshService(serviceName: string) {
    const key = serviceKeyMap[serviceName];
    if (!key) return;
    setRefreshingService(serviceName);
    checkService.mutate({ service: key });
  }

  // Auto-refresh countdown
  const [countdown, setCountdown] = useState(30);
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Reset countdown on refetch
  useEffect(() => {
    if (!isFetching) setCountdown(30);
  }, [isFetching]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold text-foreground">System Status</h1>
        </div>
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const services = data?.services || [];
  const metrics = data?.metrics;
  const overallStatus = data?.overallStatus || "unknown";

  // Categorize services
  const coreServices = services.filter((s: ServiceStatus) =>
    ["Application Server", "Database (PostgreSQL)"].includes(s.name)
  );
  const integrationServices = services.filter((s: ServiceStatus) =>
    !["Application Server", "Database (PostgreSQL)"].includes(s.name)
  );

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">System Status</h1>
            <p className="text-xs text-muted-foreground">
              Real-time health monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Auto-refresh in {countdown}s
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh All
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <OverallStatusBanner status={overallStatus} />

      {/* System Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{formatUptime(metrics.uptime)}</p>
              <p className="text-xs text-muted-foreground">Uptime</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-5 w-5 text-amber-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{metrics.totalRequests24h.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Requests (Session)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-red-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{metrics.errorRate24h}%</p>
              <p className="text-xs text-muted-foreground">Error Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-5 w-5 text-blue-400 mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{metrics.avgResponseTime}ms</p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Core Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Server className="h-4 w-4 text-primary" /> Core Infrastructure
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {coreServices.map((service: ServiceStatus) => (
            <ServiceCard
              key={service.name}
              service={service}
              onRefresh={() => handleRefreshService(service.name)}
              refreshing={refreshingService === service.name}
            />
          ))}
        </CardContent>
      </Card>

      {/* Integration Services */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-400" /> Third-Party Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {integrationServices.map((service: ServiceStatus) => (
            <ServiceCard
              key={service.name}
              service={service}
              onRefresh={() => handleRefreshService(service.name)}
              refreshing={refreshingService === service.name}
            />
          ))}
        </CardContent>
      </Card>

      {/* Last Checked Footer */}
      {data?.checkedAt && (
        <div className="text-center text-xs text-muted-foreground pt-2">
          Last full check: {new Date(data.checkedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}
