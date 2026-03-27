import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, BellOff, Check, CheckCheck, BookOpen, Calendar, Award, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function Notifications() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

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
      case "assignment": return <BookOpen className="h-4 w-4 text-blue-400" />;
      case "reminder": return <Calendar className="h-4 w-4 text-yellow-400" />;
      case "completion": return <Award className="h-4 w-4 text-green-400" />;
      case "alert": return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : "You're all caught up."}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAllRead.mutate()}>
            <CheckCheck className="mr-2 h-4 w-4" /> Mark All Read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : !notifications || notifications.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <BellOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any) => (
            <Card
              key={notif.id}
              className={`transition-colors ${!notif.readAt ? "border-primary/20 bg-primary/[0.02]" : ""}`}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">{typeIcon(notif.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm ${!notif.readAt ? "font-semibold text-foreground" : "text-foreground"}`}>
                        {notif.title}
                      </p>
                      {!notif.readAt && (
                        <Badge className="text-[9px] bg-primary/20 text-primary border-0 px-1.5">New</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!notif.readAt && (
                      <Button variant="ghost" size="sm" onClick={() => markRead.mutate({ id: notif.id })}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteNotif.mutate({ id: notif.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
