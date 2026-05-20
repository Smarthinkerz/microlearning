import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Download, TrendingUp, Users, AlertCircle, Award } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  lessonsCompleted: number;
  averageScore: number;
  engagementScore: number;
  status: "active" | "at-risk" | "inactive";
  lastActive: Date;
}

interface ROIMetrics {
  costPerUser: number;
  learningImpact: number;
  productivityGain: number;
  retentionRate: number;
  completionRate: number;
}

export function ManagerInsightsDashboard() {
  const [selectedMember, setSelectedMember] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<"week" | "month" | "quarter">("month");

  const { data: teamMembers, isLoading: membersLoading } = trpc.teamManagement.getTeamMembers.useQuery({ orgId: 1 });
  const { data: analytics, isLoading: analyticsLoading } = trpc.analyticsInsights.getInsights.useQuery();

  const teamMetrics = useMemo(() => {
    if (!teamMembers) return null;

    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.approvalStatus === "approved").length;
    const atRisk = 0; // Placeholder
    const avgCompletion = 0; // Placeholder
    const avgScore = 0; // Placeholder

    return { total, active, atRisk, avgCompletion, avgScore };
  }, [teamMembers]);

  const roiMetrics: ROIMetrics = useMemo(() => {
    if (!analytics) {
      return { costPerUser: 0, learningImpact: 0, productivityGain: 0, retentionRate: 0, completionRate: 0 };
    }

    return {
      costPerUser: analytics.costPerUser || 0,
      learningImpact: analytics.learningImpact || 0,
      productivityGain: analytics.productivityGain || 0,
      retentionRate: analytics.retentionRate || 0,
      completionRate: analytics.completionRate || 0,
    };
  }, [analytics]);

  const performanceTrend = useMemo(() => {
    return [
      { week: "Week 1", completion: 45, engagement: 52, roi: 1.2 },
      { week: "Week 2", completion: 52, engagement: 58, roi: 1.35 },
      { week: "Week 3", completion: 61, engagement: 65, roi: 1.52 },
      { week: "Week 4", completion: 72, engagement: 75, roi: 1.8 },
    ];
  }, []);

  const complianceStatus = useMemo(() => {
    return [
      { category: "Safety Training", completed: 18, total: 20, dueDate: "2026-06-15" },
      { category: "Compliance Certification", completed: 15, total: 20, dueDate: "2026-07-01" },
      { category: "Skills Development", completed: 12, total: 20, dueDate: "2026-08-15" },
    ];
  }, []);

  if (membersLoading || analyticsLoading) {
    return <div className="text-center py-8">Loading team insights...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics?.total || 0}</div>
            <p className="text-xs text-muted-foreground">{teamMetrics?.active || 0} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics?.avgCompletion || 0}%</div>
            <p className="text-xs text-muted-foreground">lessons completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMetrics?.avgScore || 0}%</div>
            <p className="text-xs text-muted-foreground">across all lessons</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roiMetrics.productivityGain.toFixed(1)}x</div>
            <p className="text-xs text-muted-foreground">productivity gain</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">At-Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{teamMetrics?.atRisk || 0}</div>
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

        {/* Performance Tab */}
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
                  <Line type="monotone" dataKey="completion" stroke="#3b82f6" name="Completion %" />
                  <Line type="monotone" dataKey="engagement" stroke="#10b981" name="Engagement %" />
                  <Line type="monotone" dataKey="roi" stroke="#f59e0b" name="ROI (x)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ROI Analytics Tab */}
        <TabsContent value="roi">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ROI Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Cost per User</span>
                  <span className="font-bold">${roiMetrics.costPerUser.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Learning Impact</span>
                  <span className="font-bold">{roiMetrics.learningImpact.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Productivity Gain</span>
                  <span className="font-bold text-green-600">{roiMetrics.productivityGain.toFixed(1)}x</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-sm">Retention Rate</span>
                  <span className="font-bold">{roiMetrics.retentionRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Completion Rate</span>
                  <span className="font-bold">{roiMetrics.completionRate.toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={[{ name: "Impact", value: roiMetrics.learningImpact }]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Compliance Tab */}
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
                      {item.completed}/{item.total}
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(item.completed / item.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Due: {item.dueDate}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Members Tab */}
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
                    className="p-4 border rounded-lg flex items-center justify-between hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedMember(member.id)}
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{member.lessonsCompleted} lessons</p>
                        <p className="text-xs text-muted-foreground">{member.averageScore}% avg</p>
                      </div>
                      <Badge
                        variant={
                          member.status === "active"
                            ? "default"
                            : member.status === "at-risk"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {member.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Manager Report
        </Button>
      </div>
    </div>
  );
}
