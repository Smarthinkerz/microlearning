import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Search, Shield, UserCog } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function Roster() {
  const { user } = useAuth();
  const orgId = (user as any)?.orgId;
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: members, isLoading } = trpc.org.getMembers.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const setRoleMutation = trpc.user.setRole.useMutation({
    onSuccess: () => { utils.org.getMembers.invalidate(); toast.success("Role updated"); },
    onError: (err) => toast.error(err.message),
  });

  const filtered = useMemo(() => {
    if (!members) return [];
    if (!search) return members;
    return members.filter((m: any) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [members, search]);

  const roleColor = (role: string) => {
    switch (role) {
      case "super_admin": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "employer_admin": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "content_author": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
      default: return "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team Roster</h1>
        <p className="text-muted-foreground">Manage team members and their roles.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16" />)}</div>
      ) : !filtered || filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">
              {!orgId ? "No organization assigned." : "No team members found."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((member: any) => (
            <Card key={member.id}>
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">
                        {member.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{member.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-[10px] ${roleColor(member.appRole)}`}>
                      {member.appRole}
                    </Badge>
                    {(user as any)?.appRole === "super_admin" && (
                      <Select
                        value={member.appRole}
                        onValueChange={(val) => setRoleMutation.mutate({ userId: member.id, appRole: val as any })}
                      >
                        <SelectTrigger className="w-36 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="learner">Learner</SelectItem>
                          <SelectItem value="content_author">Content Author</SelectItem>
                          <SelectItem value="employer_admin">Employer Admin</SelectItem>
                          <SelectItem value="super_admin">Super Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
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
