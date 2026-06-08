import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, Trash2, CheckCircle } from "lucide-react";

type ConfirmVariant = "destructive" | "warning" | "default";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  loading?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  onConfirm: (reason?: string) => void | Promise<void>;
}

const VARIANT_ICONS: Record<ConfirmVariant, React.ComponentType<{ className?: string }>> = {
  destructive: Trash2,
  warning: AlertTriangle,
  default: CheckCircle,
};

const VARIANT_CLASSES: Record<ConfirmVariant, string> = {
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  warning: "bg-warning text-warning-foreground hover:bg-warning/90",
  default: "",
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  requireReason = false,
  reasonLabel = "Reason",
  reasonPlaceholder = "Enter a reason…",
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState("");
  const Icon = VARIANT_ICONS[variant];

  const handleConfirm = async () => {
    await onConfirm(requireReason ? reason : undefined);
    setReason("");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={cn(
              "w-5 h-5",
              variant === "destructive" && "text-destructive",
              variant === "warning" && "text-warning",
              variant === "default" && "text-primary"
            )} />
            {title}
          </AlertDialogTitle>
          {description && (
            <AlertDialogDescription>{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>

        {requireReason && (
          <div className="space-y-1.5 py-2">
            <Label htmlFor="confirm-reason" className="text-sm font-medium">
              {reasonLabel} <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="confirm-reason"
              placeholder={reasonPlaceholder}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading || (requireReason && !reason.trim())}
            className={cn(VARIANT_CLASSES[variant], "touch-target")}
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ── Hook for easy usage ──────────────────────────────────── */
export function useConfirmDialog() {
  const [state, setState] = useState<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: ConfirmVariant;
    requireReason?: boolean;
    onConfirm: (reason?: string) => void | Promise<void>;
  }>({ open: false, title: "", onConfirm: () => {} });

  const confirm = (opts: Omit<typeof state, "open">) => {
    setState({ ...opts, open: true });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  return {
    confirm,
    dialogProps: {
      ...state,
      onOpenChange: (open: boolean) => { if (!open) close(); },
      onConfirm: async (reason?: string) => {
        await state.onConfirm(reason);
        close();
      },
    },
  };
}
