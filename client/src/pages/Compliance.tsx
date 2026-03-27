import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Download, FileText, Clock, Activity } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Compliance() {
  const { user } = useAuth();
  const orgId = (user as any)?.orgId;
  const [selectedLesson, setSelectedLesson] = useState("");

  const { data: lessons } = trpc.lesson.getByOrg.useQuery(
    { orgId: orgId!, status: "published" },
    { enabled: !!orgId }
  );

  const { data: auditLogs, isLoading: logsLoading } = trpc.audit.getByOrg.useQuery(
    { orgId: orgId!, limit: 50 },
    { enabled: !!orgId }
  );

  const { data: xapiData, isLoading: xapiLoading } = trpc.compliance.exportXapi.useQuery(
    { lessonId: parseInt(selectedLesson) },
    { enabled: !!selectedLesson }
  );

  const handleExportXapi = () => {
    if (!xapiData) return;
    const blob = new Blob([JSON.stringify(xapiData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xapi-export-lesson-${selectedLesson}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("xAPI data exported");
  };

  const handleExportAudit = () => {
    if (!auditLogs) return;
    const csv = [
      "Timestamp,Action,Resource Type,Resource ID,User ID,Details",
      ...auditLogs.map((log: any) =>
        `${new Date(log.createdAt).toISOString()},${log.action},${log.resourceType},${log.resourceId || ""},${log.userId || ""},${JSON.stringify(log.details || {})}`
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Audit log exported");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance & Reporting</h1>
        <p className="text-muted-foreground">SCORM/xAPI export and audit trail for enterprise compliance.</p>
      </div>

      <Tabs defaultValue="xapi">
        <TabsList>
          <TabsTrigger value="xapi">xAPI Export</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="xapi" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" /> xAPI Statement Export
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Export xAPI-compliant learning statements for integration with your enterprise LMS.
                Select a lesson to generate xAPI statements for all learner attempts.
              </p>
              <div className="flex gap-3">
                <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a lesson to export" />
                  </SelectTrigger>
                  <SelectContent>
                    {(lessons || []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id.toString()}>{l.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleExportXapi} disabled={!selectedLesson || xapiLoading}>
                  <Download className="mr-2 h-4 w-4" /> Export JSON
                </Button>
              </div>
              {xapiData && (
                <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                  <p className="text-foreground font-medium">{xapiData.lesson?.title}</p>
                  <p className="text-muted-foreground">{xapiData.statements?.length || 0} xAPI statements found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">SCORM Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Lessons are structured to be SCORM 2004 compatible. The xAPI export includes
                all required fields for LMS integration including actor, verb, object, result,
                and timestamp. Import the exported JSON into your SCORM-compliant LMS.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs font-medium text-foreground">Supported Standards</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">xAPI 1.0.3</Badge>
                    <Badge variant="outline" className="text-[10px]">SCORM 2004</Badge>
                    <Badge variant="outline" className="text-[10px]">cmi5</Badge>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30">
                  <p className="text-xs font-medium text-foreground">Export Formats</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">JSON</Badge>
                    <Badge variant="outline" className="text-[10px]">CSV</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Audit Trail
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleExportAudit} disabled={!auditLogs || auditLogs.length === 0}>
                <Download className="mr-2 h-4 w-4" /> Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12" />)}</div>
              ) : !auditLogs || auditLogs.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">No audit logs recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">{log.action}</span>
                          {" on "}
                          <span className="text-muted-foreground">{log.resourceType} #{log.resourceId}</span>
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(log.createdAt).toLocaleString()}
                          {log.userId && ` by user #${log.userId}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
