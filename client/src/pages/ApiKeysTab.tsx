import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Key, Eye, EyeOff, CheckCircle2, XCircle, Save, Trash2, ExternalLink
} from "lucide-react";

type ApiKeyField = {
  key: "openaiApiKey" | "elevenLabsApiKey" | "tapSecretKey" | "tapPublicKey" | "smarthinkerzWebhookSecret" | "openaiBaseUrl";
  label: string;
  placeholder: string;
  description: string;
  docsUrl?: string;
  isUrl?: boolean;
};

const API_KEY_FIELDS: ApiKeyField[] = [
  {
    key: "openaiApiKey",
    label: "OpenAI API Key",
    placeholder: "sk-...",
    description: "Used for AI lesson generation, content translation, and adaptive recommendations.",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    key: "openaiBaseUrl",
    label: "OpenAI Base URL (optional)",
    placeholder: "https://api.openai.com/v1",
    description: "Override to use Azure OpenAI, Groq, or another OpenAI-compatible endpoint.",
    isUrl: true,
  },
  {
    key: "elevenLabsApiKey",
    label: "ElevenLabs API Key",
    placeholder: "...",
    description: "Used for text-to-speech voice generation in lesson audio.",
    docsUrl: "https://elevenlabs.io/app/settings/api-keys",
  },
  {
    key: "tapSecretKey",
    label: "Tap Payments — Secret Key",
    placeholder: "sk-...",
    description: "Server-side secret key for processing payments via Tap gateway.",
    docsUrl: "https://developers.tap.company",
  },
  {
    key: "tapPublicKey",
    label: "Tap Payments — Public Key",
    placeholder: "pk-...",
    description: "Client-side public key for Tap payment forms.",
    docsUrl: "https://developers.tap.company",
  },
  {
    key: "smarthinkerzWebhookSecret",
    label: "Smarthinkerz Webhook Secret",
    placeholder: "...",
    description: "HMAC secret for verifying incoming webhook payloads from Smarthinkerz.",
  },
];

function KeyRow({ field, hasKey, maskedValue, onSave, onClear }: {
  field: ApiKeyField;
  hasKey: boolean;
  maskedValue: string;
  onSave: (key: string, value: string) => void;
  onClear: (key: ApiKeyField["key"]) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);

  const handleSave = () => {
    if (!value.trim()) { toast.error("Value cannot be empty"); return; }
    onSave(field.key, value.trim());
    setValue("");
    setEditing(false);
  };

  return (
    <div className="space-y-2 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Label className="text-sm font-semibold">{field.label}</Label>
            {hasKey ? (
              <Badge variant="outline" className="text-xs text-success border-success/40 bg-success/10 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Set
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                <XCircle className="h-3 w-3" /> Not set
              </Badge>
            )}
            {field.docsUrl && (
              <a href={field.docsUrl} target="_blank" rel="noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-0.5">
                Docs <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
          {hasKey && !editing && (
            <p className="text-xs font-mono text-muted-foreground mt-1 bg-muted/50 rounded px-2 py-0.5 inline-block">
              {maskedValue}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing && (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
              {hasKey ? "Update" : "Set"}
            </Button>
          )}
          {hasKey && !editing && (
            <Button size="sm" variant="outline" className="text-destructive hover:text-destructive"
              onClick={() => onClear(field.key)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {editing && (
        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={field.placeholder}
              className="pr-10 font-mono text-sm"
              onKeyDown={e => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setValue(""); } }}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-3.5 w-3.5 mr-1" /> Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => { setEditing(false); setValue(""); }}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

export function ApiKeysTab() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.crm.getApiKeys.useQuery();

  const setKeys = trpc.crm.setApiKeys.useMutation({
    onSuccess: () => {
      toast.success("API key saved successfully");
      utils.crm.getApiKeys.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const clearKey = trpc.crm.clearApiKey.useMutation({
    onSuccess: () => {
      toast.success("API key removed");
      utils.crm.getApiKeys.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSave = (key: string, value: string) => {
    setKeys.mutate({ [key]: value } as any);
  };

  const handleClear = (key: ApiKeyField["key"]) => {
    clearKey.mutate({ key });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const keyData = data ?? {
    openaiApiKey: "", elevenLabsApiKey: "", tapSecretKey: "", tapPublicKey: "",
    smarthinkerzWebhookSecret: "", openaiBaseUrl: "",
    hasOpenaiApiKey: false, hasElevenLabsApiKey: false,
    hasTapSecretKey: false, hasTapPublicKey: false, hasSmarthinkerzWebhookSecret: false,
  };

  const hasMap: Record<string, boolean> = {
    openaiApiKey: keyData.hasOpenaiApiKey,
    elevenLabsApiKey: keyData.hasElevenLabsApiKey,
    tapSecretKey: keyData.hasTapSecretKey,
    tapPublicKey: keyData.hasTapPublicKey,
    smarthinkerzWebhookSecret: keyData.hasSmarthinkerzWebhookSecret,
    openaiBaseUrl: !!keyData.openaiBaseUrl,
  };

  const maskedMap: Record<string, string> = {
    openaiApiKey: keyData.openaiApiKey,
    elevenLabsApiKey: keyData.elevenLabsApiKey,
    tapSecretKey: keyData.tapSecretKey,
    tapPublicKey: keyData.tapPublicKey,
    smarthinkerzWebhookSecret: keyData.smarthinkerzWebhookSecret,
    openaiBaseUrl: keyData.openaiBaseUrl,
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Key className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">API Keys & Integrations</h2>
          <p className="text-sm text-muted-foreground">
            Keys are stored encrypted in the platform database. Values are masked after saving.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">AI Services</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {API_KEY_FIELDS.filter(f => ["openaiApiKey", "openaiBaseUrl", "elevenLabsApiKey"].includes(f.key)).map(field => (
            <KeyRow
              key={field.key}
              field={field}
              hasKey={hasMap[field.key]}
              maskedValue={maskedMap[field.key]}
              onSave={handleSave}
              onClear={handleClear}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Payment Gateway</CardTitle>
          <CardDescription className="text-xs">Tap Payments integration for subscription billing</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {API_KEY_FIELDS.filter(f => ["tapSecretKey", "tapPublicKey"].includes(f.key)).map(field => (
            <KeyRow
              key={field.key}
              field={field}
              hasKey={hasMap[field.key]}
              maskedValue={maskedMap[field.key]}
              onSave={handleSave}
              onClear={handleClear}
            />
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Webhooks</CardTitle>
          <CardDescription className="text-xs">Incoming webhook verification secrets</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-border">
          {API_KEY_FIELDS.filter(f => ["smarthinkerzWebhookSecret"].includes(f.key)).map(field => (
            <KeyRow
              key={field.key}
              field={field}
              hasKey={hasMap[field.key]}
              maskedValue={maskedMap[field.key]}
              onSave={handleSave}
              onClear={handleClear}
            />
          ))}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 border border-border/50">
        <strong>Security note:</strong> API keys are stored in the <code>platform_settings</code> table with admin-only access. 
        Keys are never exposed in full — only the last 4 characters are shown after saving. 
        Rotate keys immediately if you suspect a breach.
      </div>
    </div>
  );
}
