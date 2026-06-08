import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton-variants";
import { Bell, BellOff, BellRing, Check, CheckCheck, BookOpen, Calendar, Award, AlertCircle, Trash2, Settings, Clock, Loader2 } from "lucide-react";
import { toast } from "sonner";

const NOTIFICATION_TYPES = [
  { key: "assignment", label: "New Assignments", description: "When lessons are assigned to you", icon: BookOpen },
  { key: "reminder", label: "Study Reminders", description: "Reminders before your shift to complete lessons", icon: Clock },
  { key: "completion", label: "Achievements Unlocked", description: "When you earn certificates or badges", icon: Award },
  { key: "alert", label: "System Alerts", description: "Platform updates and important notices", icon: AlertCircle },
];

export default function Notifications() {
  const { user } = useAuth();
  const utils = trpc.useUtils();
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [pushSupported, setPushSupported] = useState(false);
  const [requestingPush, setRequestingPush] = useState(false);
  const [pushPrefs, setPushPrefs] = useState<Record<string, boolean>>({ assignment: true, reminder: true, completion: true, alert: false });

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator;
    setPushSupported(supported);
    if (supported) setPushPermission(Notification.permission);
  }, []);

  const requestPushPermission = async () => {
    setRequestingPush(true);
    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === "granted") toast.success("Push notifications enabled!");
      else if (perm === "denied") toast.error("Push notifications blocked. Update browser settings to allow.");
    } finally {
      setRequestingPush(false);
    }
  };

  const { data: notifications, isLoading } = trpc.notification.getMyNotifications.useQuery();

  const markRead = trpc.notification.markRead.useMutation({
    onSuccess: () => utils.notification.getMyNotifications.invalidate(),
  });

  const markAllRead = trpc.notification.markAllRead.useMutation({
    onSuccess: () => {
      utils.notification.getMyNotifications.invalidate();
      toast.success("All notifications marked as read");
    },
  });

  const deleteNotif = trpc.notification.deleteNotification.useMutation({
    onSuccess: () => utils.notification.getMyNotifications.invalidate(),
  });

  const unreadCount = (notifications || []).filter((n: any) => !n.readAt).length;


  const typeIcon = (type: string) => {
    switch (type) {
      case "assignment": return <BookOpen className="h-4 w-4 text-info" />;
      case "reminder": return <Calendar className="h-4 w-4 text-warning" />;
      case "completion": return <Award className="h-4 w-4 text-success" />;
      case "alert": return <AlertCircle className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
            {unreadCount > 0 && <Badge className="tabular-nums">{unreadCount}</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      <Tabs defaultValue="inbox">
        <TabsList>
          <TabsTrigger value="inbox" className="gap-2">
            <BellRing className="w-4 h-4" /> Inbox
            {unreadCount > 0 && <Badge className="ml-1 h-5 px-1.5 text-xs tabular-nums">{unreadCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Settings
          </TabsTrigger>
        </TabsList>

        {/* Inbox */}
        <TabsContent value="inbox" className="mt-4">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : !notifications || notifications.length === 0 ? (
            <EmptyState icon={BellOff} title="All caught up!" description="No notifications yet. We'll let you know when something important happens." compact />
          ) : (
            <div className="space-y-1">
              {notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-smooth cursor-pointer hover:bg-accent group ${
                    !notif.readAt ? "bg-primary/5 border border-primary/10" : ""
                  }`}
                  onClick={() => !notif.readAt && markRead.mutate({ id: notif.id })}
                >
                  <div className={`mt-0.5 p-2 rounded-full shrink-0 ${
                    !notif.readAt ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {typeIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!notif.readAt ? "font-semibold" : "font-medium"}`}>{notif.title}</p>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-0.5">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {notif.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-fast">
                    {!notif.readAt && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); markRead.mutate({ id: notif.id }); }}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:text-destructive" onClick={(e) => { e.stopPropagation(); deleteNotif.mutate({ id: notif.id }); }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  {!notif.readAt && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BellRing className="w-5 h-5 text-primary" /> Push Notifications
              </CardTitle>
              <CardDescription>Receive real-time notifications on your device even when the app is closed.</CardDescription>
            </CardHeader>
            <CardContent>
              {!pushSupported ? (
                <p className="text-sm text-muted-foreground flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Not supported in this browser.</p>
              ) : pushPermission === "granted" ? (
                <p className="text-sm text-success flex items-center gap-2"><Bell className="w-4 h-4" /> Push notifications enabled on this device.</p>
              ) : pushPermission === "denied" ? (
                <div className="space-y-1">
                  <p className="text-sm text-destructive flex items-center gap-2"><BellOff className="w-4 h-4" /> Blocked. Update browser site settings to allow.</p>
                </div>
              ) : (
                <Button onClick={requestPushPermission} disabled={requestingPush} className="gap-2 touch-target">
                  {requestingPush ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                  Enable Push Notifications
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Types</CardTitle>
              <CardDescription>Choose which notifications you want to receive.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {NOTIFICATION_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <div key={type.key} className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-muted mt-0.5"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                      <div>
                        <Label htmlFor={`pref-${type.key}`} className="font-medium cursor-pointer">{type.label}</Label>
                        <p className="text-xs text-muted-foreground mt-0.5">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      id={`pref-${type.key}`}
                      checked={pushPrefs[type.key] ?? true}
                      onCheckedChange={(v) => setPushPrefs((p) => ({ ...p, [type.key]: v }))}
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Delivery Status</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">In-App Inbox</Label><p className="text-xs text-muted-foreground">Always shown in your notification inbox</p></div>
                <StatusBadge status="active" label="Always on" showIcon={false} />
              </div>
              <div className="flex items-center justify-between">
                <div><Label className="font-medium">Browser Push</Label><p className="text-xs text-muted-foreground">Requires permission above</p></div>
                <StatusBadge status={pushPermission === "granted" ? "active" : pushPermission === "denied" ? "blocked" : "pending"} label={pushPermission === "granted" ? "Enabled" : pushPermission === "denied" ? "Blocked" : "Not set"} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
