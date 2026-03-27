import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Palette, Users, BookOpen, Building2, BarChart3, Loader2,
  Search, Pencil, Trash2, Plus, Eye, Save, RefreshCw,
  Type, Layout, Sun, Moon, Image as ImageIcon, Wrench,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";

// ─── Branding Tab ───────────────────────────────────────────────────
function BrandingTab() {
  const { data: branding, isLoading } = trpc.crm.getBranding.useQuery();
  const utils = trpc.useUtils();
  const updateBranding = trpc.crm.updateBranding.useMutation({
    onSuccess: () => {
      toast.success("Branding updated successfully");
      utils.crm.getBranding.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    if (branding) setForm(branding as Record<string, any>);
  }, [branding]);

  const update = (key: string, value: any) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSave = () => {
    updateBranding.mutate(form as any);
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* App Identity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Type className="h-4 w-4 text-primary" /> App Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>App Name</Label>
              <Input value={form.appName || ""} onChange={e => update("appName", e.target.value)} placeholder="Smarthinkerz LearnShift" />
            </div>
            <div>
              <Label>Font Family</Label>
              <Select value={form.fontFamily || "Inter"} onValueChange={v => update("fontFamily", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                  <SelectItem value="Poppins">Poppins</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="Lato">Lato</SelectItem>
                  <SelectItem value="Montserrat">Montserrat</SelectItem>
                  <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Logo URL</Label>
              <Input value={form.logoUrl || ""} onChange={e => update("logoUrl", e.target.value)} placeholder="https://..." />
              {form.logoUrl && (
                <div className="mt-2 p-2 bg-muted rounded-md inline-block">
                  <img src={form.logoUrl} alt="Logo preview" className="h-10 object-contain" />
                </div>
              )}
            </div>
            <div>
              <Label>Favicon URL</Label>
              <Input value={form.faviconUrl || ""} onChange={e => update("faviconUrl", e.target.value)} placeholder="https://..." />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Colors & Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-4 w-4 text-primary" /> Colors & Theme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.primaryColor || "#14b8a6"}
                  onChange={e => update("primaryColor", e.target.value)}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer"
                />
                <Input value={form.primaryColor || "#14b8a6"} onChange={e => update("primaryColor", e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.accentColor || "#0d9488"}
                  onChange={e => update("accentColor", e.target.value)}
                  className="w-10 h-10 rounded-md border border-border cursor-pointer"
                />
                <Input value={form.accentColor || "#0d9488"} onChange={e => update("accentColor", e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Theme</Label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  onClick={() => update("theme", "dark")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${form.theme === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Moon className="h-4 w-4" /> Dark
                </button>
                <button
                  onClick={() => update("theme", "light")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${form.theme === "light" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                >
                  <Sun className="h-4 w-4" /> Light
                </button>
              </div>
            </div>
          </div>
          <div>
            <Label>Color Preview</Label>
            <div className="flex gap-2 mt-2">
              <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center text-xs text-white font-medium" style={{ backgroundColor: form.primaryColor || "#14b8a6" }}>Primary</div>
              <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center text-xs text-white font-medium" style={{ backgroundColor: form.accentColor || "#0d9488" }}>Accent</div>
              <div className={`w-16 h-16 rounded-lg border border-border flex items-center justify-center text-xs font-medium ${form.theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>BG</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Layout className="h-4 w-4 text-primary" /> Layout & Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Sidebar Style</Label>
            <Select value={form.sidebarStyle || "default"} onValueChange={v => update("sidebarStyle", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default (Full)</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="minimal">Minimal (Icons Only)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div>
            <Label>Landing Page Hero Title</Label>
            <Input value={form.heroTitle || ""} onChange={e => update("heroTitle", e.target.value)} />
          </div>
          <div>
            <Label>Landing Page Hero Subtitle</Label>
            <Input value={form.heroSubtitle || ""} onChange={e => update("heroSubtitle", e.target.value)} />
          </div>
          <div>
            <Label>Footer Text</Label>
            <Input value={form.footerText || ""} onChange={e => update("footerText", e.target.value)} />
          </div>
          <div>
            <Label>Custom CSS (Advanced)</Label>
            <textarea
              value={form.customCss || ""}
              onChange={e => update("customCss", e.target.value)}
              className="w-full h-24 mt-1 rounded-md border border-border bg-muted p-3 text-sm font-mono text-foreground resize-y"
              placeholder="/* Add custom CSS overrides here */"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} className="w-full" disabled={updateBranding.isPending}>
        {updateBranding.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Branding Changes
      </Button>
    </div>
  );
}

// ─── Users Tab ──────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<any>(null);

  const { data: users, isLoading } = trpc.crm.listUsers.useQuery({
    search: search || undefined,
    role: roleFilter !== "all" ? roleFilter : undefined,
  });
  const { data: orgs } = trpc.crm.listOrgs.useQuery();
  const utils = trpc.useUtils();

  const updateUser = trpc.crm.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated");
      utils.crm.listUsers.invalidate();
      setEditingUser(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteUser = trpc.crm.deleteUser.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      utils.crm.listUsers.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const roleColors: Record<string, string> = {
    super_admin: "bg-red-500/10 text-red-400 border-red-500/30",
    employer_admin: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    content_author: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    learner: "bg-green-500/10 text-green-400 border-green-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="learner">Learner</SelectItem>
            <SelectItem value="employer_admin">Employer Admin</SelectItem>
            <SelectItem value="content_author">Content Author</SelectItem>
            <SelectItem value="super_admin">Super Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {(users || []).map((u: any) => (
            <Card key={u.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-primary">{(u.name || "U").charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${roleColors[u.appRole] || ""}`}>{u.appRole}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingUser({ ...u })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
                        {editingUser && (
                          <div className="space-y-4 py-2">
                            <div>
                              <Label>Name</Label>
                              <Input value={editingUser.name || ""} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input value={editingUser.email || ""} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Select value={editingUser.appRole} onValueChange={v => setEditingUser({ ...editingUser, appRole: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="learner">Learner</SelectItem>
                                  <SelectItem value="employer_admin">Employer Admin</SelectItem>
                                  <SelectItem value="content_author">Content Author</SelectItem>
                                  <SelectItem value="super_admin">Super Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Organization</Label>
                              <Select value={String(editingUser.orgId || "none")} onValueChange={v => setEditingUser({ ...editingUser, orgId: v === "none" ? null : Number(v) })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">No Organization</SelectItem>
                                  {(orgs || []).map((o: any) => (
                                    <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={() => updateUser.mutate({ id: editingUser.id, name: editingUser.name, email: editingUser.email, appRole: editingUser.appRole, orgId: editingUser.orgId })} disabled={updateUser.isPending}>
                            {updateUser.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Delete this user? This cannot be undone.")) deleteUser.mutate({ id: u.id });
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(users || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Lessons Tab ────────────────────────────────────────────────────
function LessonsTab() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const { data: lessons, isLoading } = trpc.crm.listLessons.useQuery({
    search: search || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });
  const utils = trpc.useUtils();

  const updateLesson = trpc.crm.updateLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson updated");
      utils.crm.listLessons.invalidate();
      setEditingLesson(null);
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLesson = trpc.crm.deleteLesson.useMutation({
    onSuccess: () => {
      toast.success("Lesson deleted");
      utils.crm.listLessons.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const categories = useMemo(() => {
    const cats = new Set((lessons || []).map((l: any) => l.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [lessons]);

  const statusColors: Record<string, string> = {
    published: "bg-green-500/10 text-green-400 border-green-500/30",
    draft: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    in_review: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    archived: "bg-gray-500/10 text-gray-400 border-gray-500/30",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search lessons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {(lessons || []).map((l: any) => (
            <Card key={l.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{l.title}</p>
                      <Badge variant="outline" className={`text-xs shrink-0 ${statusColors[l.status] || ""}`}>{l.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">{l.category}</span>
                      <span className="text-xs text-muted-foreground">{l.durationMinutes}min</span>
                      <span className="text-xs text-muted-foreground capitalize">{l.difficulty}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingLesson({ ...l })}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Edit Lesson</DialogTitle></DialogHeader>
                        {editingLesson && (
                          <div className="space-y-4 py-2">
                            <div>
                              <Label>Title</Label>
                              <Input value={editingLesson.title || ""} onChange={e => setEditingLesson({ ...editingLesson, title: e.target.value })} />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <textarea
                                value={editingLesson.description || ""}
                                onChange={e => setEditingLesson({ ...editingLesson, description: e.target.value })}
                                className="w-full h-20 rounded-md border border-border bg-muted p-2 text-sm text-foreground resize-y"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Category</Label>
                                <Input value={editingLesson.category || ""} onChange={e => setEditingLesson({ ...editingLesson, category: e.target.value })} />
                              </div>
                              <div>
                                <Label>Duration (min)</Label>
                                <Input type="number" value={editingLesson.durationMinutes || 5} onChange={e => setEditingLesson({ ...editingLesson, durationMinutes: Number(e.target.value) })} />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label>Difficulty</Label>
                                <Select value={editingLesson.difficulty} onValueChange={v => setEditingLesson({ ...editingLesson, difficulty: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <Select value={editingLesson.status} onValueChange={v => setEditingLesson({ ...editingLesson, status: v })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="in_review">In Review</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        )}
                        <DialogFooter>
                          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                          <Button onClick={() => updateLesson.mutate({
                            id: editingLesson.id,
                            title: editingLesson.title,
                            description: editingLesson.description,
                            category: editingLesson.category,
                            durationMinutes: editingLesson.durationMinutes,
                            difficulty: editingLesson.difficulty,
                            status: editingLesson.status,
                          })} disabled={updateLesson.isPending}>
                            {updateLesson.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Changes
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                      if (confirm("Delete this lesson? This cannot be undone.")) deleteLesson.mutate({ id: l.id });
                    }}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(lessons || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No lessons found.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Organizations Tab ──────────────────────────────────────────────
function OrganizationsTab() {
  const { data: orgs, isLoading } = trpc.crm.listOrgs.useQuery();
  const utils = trpc.useUtils();
  const [showCreate, setShowCreate] = useState(false);
  const [newOrg, setNewOrg] = useState({ name: "", slug: "", industry: "", maxUsers: 100 });
  const [editingOrg, setEditingOrg] = useState<any>(null);

  const createOrg = trpc.crm.createOrg.useMutation({
    onSuccess: () => {
      toast.success("Organization created");
      utils.crm.listOrgs.invalidate();
      utils.crm.getStats.invalidate();
      setShowCreate(false);
      setNewOrg({ name: "", slug: "", industry: "", maxUsers: 100 });
    },
    onError: (err) => toast.error(err.message),
  });

  const updateOrg = trpc.crm.updateOrg.useMutation({
    onSuccess: () => {
      toast.success("Organization updated");
      utils.crm.listOrgs.invalidate();
      setEditingOrg(null);
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="mr-2 h-4 w-4" /> New Organization
        </Button>
      </div>

      {showCreate && (
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={newOrg.name} onChange={e => setNewOrg({ ...newOrg, name: e.target.value })} placeholder="Acme Corp" />
              </div>
              <div>
                <Label>Slug</Label>
                <Input value={newOrg.slug} onChange={e => setNewOrg({ ...newOrg, slug: e.target.value })} placeholder="acme-corp" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Industry</Label>
                <Input value={newOrg.industry} onChange={e => setNewOrg({ ...newOrg, industry: e.target.value })} placeholder="Healthcare" />
              </div>
              <div>
                <Label>Max Users</Label>
                <Input type="number" value={newOrg.maxUsers} onChange={e => setNewOrg({ ...newOrg, maxUsers: Number(e.target.value) })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button size="sm" onClick={() => createOrg.mutate(newOrg)} disabled={createOrg.isPending || !newOrg.name || !newOrg.slug}>
                {createOrg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-2">
          {(orgs || []).map((o: any) => (
            <Card key={o.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{o.name}</p>
                      <Badge variant={o.isActive ? "default" : "secondary"} className="text-xs">{o.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-muted-foreground">Slug: {o.slug}</span>
                      {o.industry && <span className="text-xs text-muted-foreground">{o.industry}</span>}
                      <span className="text-xs text-muted-foreground">Max: {o.maxUsers} users</span>
                    </div>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingOrg({ ...o })}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Edit Organization</DialogTitle></DialogHeader>
                      {editingOrg && (
                        <div className="space-y-4 py-2">
                          <div>
                            <Label>Name</Label>
                            <Input value={editingOrg.name} onChange={e => setEditingOrg({ ...editingOrg, name: e.target.value })} />
                          </div>
                          <div>
                            <Label>Industry</Label>
                            <Input value={editingOrg.industry || ""} onChange={e => setEditingOrg({ ...editingOrg, industry: e.target.value })} />
                          </div>
                          <div>
                            <Label>Max Users</Label>
                            <Input type="number" value={editingOrg.maxUsers} onChange={e => setEditingOrg({ ...editingOrg, maxUsers: Number(e.target.value) })} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label>Active</Label>
                            <Switch checked={editingOrg.isActive} onCheckedChange={v => setEditingOrg({ ...editingOrg, isActive: v })} />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                        <Button onClick={() => updateOrg.mutate({ id: editingOrg.id, name: editingOrg.name, industry: editingOrg.industry, maxUsers: editingOrg.maxUsers, isActive: editingOrg.isActive })} disabled={updateOrg.isPending}>
                          {updateOrg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Save
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
          {(orgs || []).length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No organizations yet.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main CRM Page ──────────────────────────────────────────────────
export default function AdminCRM() {
  const { user, loading } = useAuth({ redirectOnUnauthenticated: true });
  const appRole = (user as any)?.appRole || "learner";
  const { data: stats } = trpc.crm.getStats.useQuery(undefined, {
    enabled: appRole === "super_admin" || (user as any)?.role === "admin",
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (appRole !== "super_admin" && (user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          <p className="text-muted-foreground mt-2">Admin CRM is only accessible to super admins.</p>
          <a href="/dashboard" className="mt-4 inline-block text-primary hover:underline text-sm">Back to Dashboard</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Standalone Admin Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Dashboard
            </a>
            <Separator orientation="vertical" className="h-5" />
            <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              Admin CRM
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">{user?.name || "Admin"}</Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <div>
        <p className="text-muted-foreground">Manage platform branding, users, lessons, and organizations.</p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.userCount}</p>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.lessonCount}</p>
              <p className="text-xs text-muted-foreground">Total Lessons</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.publishedCount}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Building2 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold text-foreground">{stats.orgCount}</p>
              <p className="text-xs text-muted-foreground">Organizations</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="branding" className="flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5" /> Branding
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Users
          </TabsTrigger>
          <TabsTrigger value="lessons" className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> Lessons
          </TabsTrigger>
          <TabsTrigger value="orgs" className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" /> Organizations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="mt-6">
          <BrandingTab />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UsersTab />
        </TabsContent>
        <TabsContent value="lessons" className="mt-6">
          <LessonsTab />
        </TabsContent>
        <TabsContent value="orgs" className="mt-6">
          <OrganizationsTab />
        </TabsContent>
      </Tabs>
      </main>
    </div>
  );
}
