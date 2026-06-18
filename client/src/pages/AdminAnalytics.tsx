import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import {
  Users, DollarSign, TrendingUp, TrendingDown,
  CreditCard, Activity, BarChart3, PieChart as PieIcon
} from "lucide-react";

const PLAN_COLORS: Record<string, string> = {
  starter: "#64748b",
  pro: "#14b8a6",
  enterprise: "#8b5cf6",
  consumer_free: "#f59e0b",
  consumer_premium: "#ec4899",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#14b8a6",
  trial: "#f59e0b",
  past_due: "#ef4444",
  canceled: "#6b7280",
  expired: "#374151",
};

function fmt(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(cents / 100);
}

function MetricCard({
  title, value, sub, icon: Icon, trend, color = "text-primary",
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  trend?: "up" | "down" | "neutral";
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{title}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-3 flex items-center gap-1 text-xs">
            {trend === "up" ? (
              <TrendingUp className="h-3.5 w-3.5 text-success" />
            ) : trend === "down" ? (
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SkeletonMetrics() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card key={i}><CardContent className="p-5"><Skeleton className="h-16 w-full" /></CardContent></Card>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const { data, isLoading, error } = trpc.crm.getSubscriberAnalytics.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6 page-enter">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Subscribers, revenue, and growth metrics</p>
        </div>
        <SkeletonMetrics />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5"><Skeleton className="h-64 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Failed to load analytics. Make sure you have super admin access.</p>
      </div>
    );
  }

  // Build status pie data
  const statusPieData = data.byStatus.map(r => ({
    name: r.status.charAt(0).toUpperCase() + r.status.slice(1),
    value: r.total,
    color: STATUS_COLORS[r.status] ?? "#6b7280",
  }));

  // Build plan pie data
  const planPieData = data.byPlan.map(r => ({
    name: r.planName,
    value: r.total,
    color: PLAN_COLORS[r.tier] ?? "#6b7280",
  }));

  // Merge monthly revenue + new subs into one timeline
  const allMonths = Array.from(
    new Set([
      ...data.monthlyRevenue.map(r => r.month),
      ...data.monthlyNewSubs.map(r => r.month),
    ])
  ).sort();

  const timelineData = allMonths.map(month => {
    const rev = data.monthlyRevenue.find(r => r.month === month);
    const sub = data.monthlyNewSubs.find(r => r.month === month);
    return {
      month,
      revenue: rev ? rev.revenue / 100 : 0,
      newSubs: sub ? sub.newSubs : 0,
    };
  });

  const totalSubs = data.totalActive + data.totalTrial + data.totalCanceled;

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Real-time subscriber and revenue metrics</p>
        </div>
        <Badge variant="outline" className="text-xs">
          <Activity className="h-3 w-3 mr-1" /> Live
        </Badge>
      </div>

      {/* KPI Row 1 — Users & Subscribers */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          sub="All registered accounts"
          icon={Users}
        />
        <MetricCard
          title="Active Subscribers"
          value={data.totalActive.toLocaleString()}
          sub={`${totalSubs > 0 ? Math.round((data.totalActive / totalSubs) * 100) : 0}% of all subs`}
          icon={CreditCard}
          color="text-success"
        />
        <MetricCard
          title="Trial Users"
          value={data.totalTrial.toLocaleString()}
          sub="Free trial active"
          icon={Activity}
          color="text-warning"
        />
        <MetricCard
          title="Churned"
          value={data.totalCanceled.toLocaleString()}
          sub="Canceled subscriptions"
          icon={TrendingDown}
          color="text-destructive"
        />
      </div>

      {/* KPI Row 2 — Revenue */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="MRR"
          value={fmt(data.mrrCents)}
          sub="Monthly Recurring Revenue"
          icon={DollarSign}
          color="text-primary"
        />
        <MetricCard
          title="ARR"
          value={fmt(data.arrCents)}
          sub="Annual Run Rate"
          icon={TrendingUp}
          color="text-primary"
        />
        <MetricCard
          title="Total Revenue"
          value={fmt(data.totalRevenueCents)}
          sub="All-time succeeded payments"
          icon={DollarSign}
        />
        <MetricCard
          title="Avg Revenue / Sub"
          value={data.totalActive > 0 ? fmt(Math.round(data.mrrCents / data.totalActive)) : "$0"}
          sub="Per active subscriber / month"
          icon={BarChart3}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Monthly Revenue (USD)
            </CardTitle>
            <CardDescription className="text-xs">Last 6 months of succeeded payments</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No payment data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={timelineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* New Subscribers Line Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" /> New Subscribers
            </CardTitle>
            <CardDescription className="text-xs">Monthly subscriber growth over last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No subscription data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={timelineData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [v, "New Subscribers"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="newSubs"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ r: 4, fill: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 — Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Subscriptions by Status
            </CardTitle>
            <CardDescription className="text-xs">Distribution of all subscription statuses</CardDescription>
          </CardHeader>
          <CardContent>
            {statusPieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No subscription data yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {statusPieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Subscribers by Plan Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-primary" /> Active Subscribers by Plan
            </CardTitle>
            <CardDescription className="text-xs">Breakdown of active subscriptions per pricing tier</CardDescription>
          </CardHeader>
          <CardContent>
            {planPieData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No active subscriptions yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie
                      data={planPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {planPieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 flex-1">
                  {planPieData.map((entry, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: entry.color }} />
                        <span className="text-muted-foreground truncate max-w-[100px]">{entry.name}</span>
                      </div>
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Combined Revenue + Subs Dual-Axis Chart */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" /> Revenue vs New Subscribers
            </CardTitle>
            <CardDescription className="text-xs">6-month correlation between growth and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={timelineData} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `$${v}`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number, name: string) => [name === "revenue" ? `$${v.toFixed(2)}` : v, name === "revenue" ? "Revenue" : "New Subs"]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue ($)" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} opacity={0.85} />
                <Line yAxisId="right" type="monotone" dataKey="newSubs" name="New Subs" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
