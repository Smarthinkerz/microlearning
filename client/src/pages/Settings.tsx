import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Bell, Globe, Building2, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const appRole = (user as any)?.appRole || "learner";
  const orgId = (user as any)?.orgId;

  const { data: org } = trpc.org.getMine.useQuery(undefined, { enabled: !!orgId });

  const [timezone, setTimezone] = useState((user as any)?.timezone || "UTC");
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [inAppNotif, setInAppNotif] = useState(true);
  const [quietStart, setQuietStart] = useState("22:00");
  const [quietEnd, setQuietEnd] = useState("07:00");

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => toast.success("Settings saved"),
    onError: (err) => toast.error(err.message),
  });

  const handleSave = () => {
    updateProfile.mutate({
      timezone,
      notificationPreferences: {
        email: emailNotif,
        push: pushNotif,
        inApp: inAppNotif,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
      },
    });
  };

  const timezones = [
    "UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
    "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Shanghai",
    "Asia/Kolkata", "Australia/Sydney", "Pacific/Auckland",
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-primary" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Name</Label>
              <p className="text-sm font-medium text-foreground">{user?.name || "Not set"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm font-medium text-foreground">{user?.email || "Not set"}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <Badge variant="outline" className="mt-1">{appRole}</Badge>
            </div>
            <div>
              <Label className="text-muted-foreground">Organization</Label>
              <p className="text-sm font-medium text-foreground">{org?.name || "None"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" /> Timezone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={timezone} onValueChange={setTimezone}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timezones.map(tz => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            Used for shift scheduling and lesson delivery timing.
          </p>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Email Notifications</Label>
              <p className="text-xs text-muted-foreground">Receive lesson reminders via email</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Push Notifications</Label>
              <p className="text-xs text-muted-foreground">Browser push notifications for new assignments</p>
            </div>
            <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>In-App Notifications</Label>
              <p className="text-xs text-muted-foreground">Show notifications within the app</p>
            </div>
            <Switch checked={inAppNotif} onCheckedChange={setInAppNotif} />
          </div>
          <Separator />
          <div>
            <Label>Quiet Hours</Label>
            <p className="text-xs text-muted-foreground mb-2">No notifications during these hours</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Start</Label>
                <Input type="time" value={quietStart} onChange={(e) => setQuietStart(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">End</Label>
                <Input type="time" value={quietEnd} onChange={(e) => setQuietEnd(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization (admin only) */}
      {["employer_admin", "super_admin"].includes(appRole) && org && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Organization Name</Label>
              <p className="text-sm font-medium text-foreground">{org.name}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Slug</Label>
              <p className="text-sm text-foreground">{org.slug}</p>
            </div>
            {org.industry && (
              <div>
                <Label className="text-muted-foreground">Industry</Label>
                <p className="text-sm text-foreground">{org.industry}</p>
              </div>
            )}
            <div>
              <Label className="text-muted-foreground">Max Users</Label>
              <p className="text-sm text-foreground">{org.maxUsers}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={handleSave} className="w-full" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SettingsIcon className="mr-2 h-4 w-4" />}
        Save Settings
      </Button>
    </div>
  );
}
