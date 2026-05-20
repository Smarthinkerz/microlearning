import { useEffect, useState } from "react";
import { useRouter } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type PaymentStatus = "loading" | "success" | "failed" | "error";

export function PaymentCallback() {
  const [, navigate] = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<PaymentStatus>("loading");
  const [message, setMessage] = useState("");

  const verifyPaymentMutation = trpc.paymentCallback.verifyPayment.useMutation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Parse query parameters
        const params = new URLSearchParams(window.location.search);
        const paymentStatus = params.get("status");
        const orderId = params.get("order_id");
        const tapId = params.get("tap_id");
        const externalRef = params.get("external_ref");

        if (!paymentStatus || !orderId) {
          setStatus("error");
          setMessage("Invalid payment parameters. Please contact support.");
          return;
        }

        // Verify payment with backend
        const result = await verifyPaymentMutation.mutateAsync({
          status: paymentStatus as "paid" | "failed" | "cancelled",
          orderId,
          tapId: tapId || undefined,
          externalRef: externalRef || undefined,
        });

        if (result.success) {
          setStatus("success");
          setMessage("Payment successful! Your subscription has been activated.");

          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            navigate("/dashboard");
          }, 3000);
        } else {
          setStatus("failed");
          setMessage(result.message || "Payment verification failed. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "An unexpected error occurred.");
      }
    };

    if (user) {
      verifyPayment();
    }
  }, [user, verifyPaymentMutation, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground">Please log in to complete your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Processing</CardTitle>
          <CardDescription>Verifying your payment...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-center text-sm text-muted-foreground">Processing your payment, please wait...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-green-600">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">{message}</p>
                <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center gap-4">
              <XCircle className="w-12 h-12 text-red-600" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-red-600">Payment Failed</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <Button onClick={() => navigate("/pricing")} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-amber-600" />
              <div className="text-center space-y-2">
                <p className="font-semibold text-amber-600">Error</p>
                <p className="text-sm text-muted-foreground">{message}</p>
              </div>
              <div className="flex gap-2 w-full">
                <Button onClick={() => navigate("/pricing")} variant="outline" className="flex-1">
                  Back to Pricing
                </Button>
                <Button onClick={() => navigate("/dashboard")} className="flex-1">
                  Go to Dashboard
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
