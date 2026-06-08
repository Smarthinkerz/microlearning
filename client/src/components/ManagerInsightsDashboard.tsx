import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, Users, AlertCircle, Award } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ROIMetrics {
  costPerUser: number;
  learningImpact: number;
  productivityGain: number;
  retentionRate: number;
  completionRate: number;
}

export function ManagerInsightsDashboard() {
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  const { data: teamMembers, isLoading: membersLoading } = trpc.teamManagement.getTeamMembers.useQuery({ orgId: 1 });
  const { data: analytics, isLoading: analyticsLoading } = trpc.analyticsInsights.getInsights.useQuery();

  const teamMetrics = useMemo(() => {
    if (!teamMembers) return null;
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.approvalStatus === "approved").length;
    const atRisk = 0;
    const avgCompletion = 0;
    const avgScore = 0;
    return { total, active, atRisk, avgCompletion, avgScore };
  }, [teamMembers]);

  const roiMetrics: ROIMetrics = useMemo(() => {
    const a = analytics as Record<string, number> | null | undefined;
    if (!a) return { costPerUser: 0, learningImpact: 0, productivityGain: 0, retentionRate: 0, completionRate: 0 };
    return {
      costPerUser: a.costPerUser ?? 0,
      learningImpact: a.learningImpact ?? 0,
      productivityGain: a.productivityGain ?? 0,
      retentionRate: a.retentionRate ?? 0,
      completionRate: a.completionRate ?? 0,
    };
  }, [analytics]);

  const performanceTrend = useMemo(() => [
    { week: "Week 1", completion: 45, engagement: 52, roi: 1.2 },
    { week: "Week 2", completion: 52, engagement: 58, roi: 1.35 },
    { week: "Week 3", completion: 61, engagement: 65, roi: 1.52 },
    { week: "Week 4", completion: 72, engagement: 75, roi: 1.8 },
  ], []);

  const complianceStatus = useMemo(() => [
    { category: "Safety Training", completed: 18, total: 20, dueDate: "2026-06-15" },
    { category: "Compliance Certification", completed: 15, total: 20, dueDate: "2026-07-01" },
    { category: "Skills Development", completed: 12, total: 20, dueDate: "2026-08-15" },
  ], []);

  if (membersLoading || analyticsLoading) {
    return <div className="text-center py-8">Loading team insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" />Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{teamMetrics?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground">{teamMetrics?.active ?? 0} active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4" />Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{teamMetrics?.avgCompletion ?? 0}%</div>
            <p className="text-xs text-muted-foreground">lessons completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Award className="w-4 h-4" />Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{teamMetrics?.avgScore ?? 0}%</div>
            <p className="text-xs text-muted-foreground">across all lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{roiMetrics.productivityGain.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">productivity gain</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 text-destructive" />At-Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums text-destructive">{teamMetrics?.atRisk ?? 0}</div>
            <p className="text-xs text-muted-foreground">need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="roi">ROI Analytics</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Trends</CardTitle>
              <CardDescription>Completion, engagement, and ROI over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completion" stroke="var(--chart-1)" name="Completion %" />
                  <Line type="monotone" dataKey="engagement" stroke="var(--chart-2)" name="Engagement %" />
                  <Line type="monotone" dataKey="roi" stroke="var(--warning)" name="ROI (x)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roi">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle>ROI Metrics</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Cost per User", value: `$${roiMetrics.costPerUser.toFixed(2)}` },
                  { label: "Learning Impact", value: `${roiMetrics.learningImpact.toFixed(1)}%` },
                  { label: "Productivity Gain", value: `${roiMetrics.productivityGain.toFixed(1)}x`, highlight: true },
                  { label: "Retention Rate", value: `${roiMetrics.retentionRate.toFixed(1)}%` },
                  { label: "Completion Rate", value: `${roiMetrics.completionRate.toFixed(1)}%` },
                ].map((row, i, arr) => (
                  <div key={row.label} className={`flex justify-between items-center pb-2 ${i < arr.length - 1 ? "border-b" : ""}`}>
                    <span className="text-sm">{row.label}</span>
                    <span className={`font-bold tabular-nums ${row.highlight ? "text-success" : ""}`}>{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Learning Impact</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[{ name: "Impact", value: roiMetrics.learningImpact }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="var(--chart-2)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Certification Tracking</CardTitle>
              <CardDescription>Training status and expiration alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {complianceStatus.map((item) => (
                <div key={item.category} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">{item.category}</h4>
                    <Badge variant={item.completed === item.total ? "default" : "secondary"}>
                      <span className="tabular-nums">{item.completed}/{item.total}</span>
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.completed / item.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Member Performance</CardTitle>
              <CardDescription>Individual metrics and engagement status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamMembers?.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 border rounded-lg flex items-center justify-between hover:bg-accent cursor-pointer transition-smooth"
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium tabular-nums">{member.appRole}</p>
                        <p className="text-xs text-muted-foreground">{member.approvalStatus}</p>
                      </div>
                      <Badge variant={member.approvalStatus === "approved" ? "default" : "secondary"}>
                        {member.approvalStatus}
                      </Badge>
                    </div>
                  </div>
                ))}
                {selectedMember && (
                  <p className="text-xs text-muted-foreground text-center pt-2">Selected: {selectedMember}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Manager Report
        </Button>
      </div>
    </div>
  );
}
