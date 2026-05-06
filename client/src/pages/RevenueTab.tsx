import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { DollarSign, TrendingUp, Download, Calendar } from "lucide-react";
import { toast } from "sonner";

export function RevenueTab() {
  const [period, setPeriod] = useState<"30d" | "alltime">("30d");
  const { data: summary, isLoading: summaryLoading } = trpc.revenue.getRevenueSummary.useQuery({ orgId: 1 });
  const { data: monthly, isLoading: monthlyLoading } = trpc.revenue.getMonthlyRevenue.useQuery({ orgId: 1 });
  const { data: topUsers, isLoading: usersLoading } = trpc.revenue.getUserRevenueContribution.useQuery({ orgId: 1, limit: 10 });

  const handleExport = () => {
    toast.info("Revenue CSV export feature coming soon");
  };

  if (summaryLoading || monthlyLoading || usersLoading) {
    return <div className="p-6 text-center">Loading revenue data...</div>;
  }

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Revenue Analytics</h2>
          <p className="text-sm text-gray-500">Track earnings and OpenAI API costs</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2">
        <Button
          variant={period === "30d" ? "default" : "outline"}
          onClick={() => setPeriod("30d")}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          Last 30 Days
        </Button>
        <Button
          variant={period === "alltime" ? "default" : "outline"}
          onClick={() => setPeriod("alltime")}
          className="gap-2"
        >
          <Calendar className="w-4 h-4" />
          All Time
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Gross Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.grossRevenue)}</div>
              <p className="text-xs text-gray-500">{summary.paymentCount} payments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">OpenAI Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{formatCurrency(summary.openAICosts)}</div>
              <p className="text-xs text-gray-500">15% of revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Net Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.netRevenue)}</div>
              <p className="text-xs text-gray-500">After costs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Daily Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.dailyAverage)}</div>
              <p className="text-xs text-gray-500">Per day</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Chart */}
      {monthly && monthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
            <CardDescription>Gross, OpenAI costs, and net revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Legend />
                <Bar dataKey="grossRevenue" fill="#3b82f6" name="Gross Revenue" />
                <Bar dataKey="openAICosts" fill="#f97316" name="OpenAI Costs" />
                <Bar dataKey="netRevenue" fill="#22c55e" name="Net Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Users */}
      {topUsers && topUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Revenue Contributors</CardTitle>
            <CardDescription>Users generating the most revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topUsers.map((user: any, idx: number) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium">Subscription #{user.subscriptionId}</p>
                    <p className="text-xs text-gray-500">{user.transactionCount} transactions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(user.netRevenue)}</p>
                    <p className="text-xs text-gray-500">{user.percentage.toFixed(1)}% of total</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
