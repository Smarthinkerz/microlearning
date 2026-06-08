import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle } from "lucide-react";
import { forwardRef } from "react";

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  helper?: string;
  error?: string;
  success?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  containerClassName?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, helper, error, success, required, multiline, rows = 3, containerClassName, id, className, ...props }, ref) => {
    const fieldId = id ?? `field-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const descId = `${fieldId}-desc`;
    const hasDesc = !!(helper || error || success);

    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={fieldId} className={cn("text-sm font-medium", required && "after:content-['*'] after:ml-0.5 after:text-destructive")}>
            {label}
          </Label>
        )}
        {multiline ? (
          <Textarea
            id={fieldId}
            rows={rows}
            aria-describedby={hasDesc ? descId : undefined}
            aria-invalid={!!error}
            className={cn(
              "transition-fast",
              error && "border-destructive focus-visible:ring-destructive/30",
              success && "border-success focus-visible:ring-success/30",
              className
            )}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <Input
            ref={ref}
            id={fieldId}
            aria-describedby={hasDesc ? descId : undefined}
            aria-invalid={!!error}
            aria-required={required}
            className={cn(
              "transition-fast",
              error && "border-destructive focus-visible:ring-destructive/30",
              success && "border-success focus-visible:ring-success/30",
              className
            )}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}
        {hasDesc && (
          <p id={descId} className={cn(
            "text-xs flex items-center gap-1",
            error ? "text-destructive" : success ? "text-success" : "text-muted-foreground"
          )}>
            {error && <AlertCircle className="w-3 h-3 shrink-0" />}
            {success && <CheckCircle className="w-3 h-3 shrink-0" />}
            {error ?? success ?? helper}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
