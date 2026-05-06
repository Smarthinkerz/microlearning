import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, Home, ArrowRight } from "lucide-react";

export function CheckoutSuccess() {
  const [location] = useLocation();
  const [, params] = useRoute("/checkout/success");
  const navigate = (path: string) => window.location.href = path;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  const searchParams = new URLSearchParams(location.split("?")[1]);
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (orderId) {
      // Simulate payment confirmation - in production, call backend to verify payment
      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 3000);
    }
  }, [orderId, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === "loading" && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <CardTitle>Processing Payment</CardTitle>
              <CardDescription>Please wait while we confirm your payment...</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <CardTitle className="text-emerald-600">Payment Successful!</CardTitle>
              <CardDescription>Your subscription has been activated</CardDescription>
            </>
          )}

          {status === "error" && (
            <>
              <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-red-500">✕</span>
              </div>
              <CardTitle className="text-red-600">Payment Confirmation Failed</CardTitle>
              <CardDescription>We couldn't confirm your payment. Please contact support.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {status === "success" && (
            <div className="space-y-4 text-center">
              <div className="bg-emerald-500/10 rounded-lg p-4">
                <p className="text-sm text-emerald-700">
                  A confirmation email has been sent to your inbox with your subscription details.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Order ID: <span className="font-mono text-xs">{orderId || "N/A"}</span></p>
                <p className="text-sm text-muted-foreground">You will be redirected to your dashboard in a few seconds...</p>
              </div>

              <Button onClick={() => navigate("/dashboard")} className="w-full gap-2">
                Go to Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-500/10 rounded-lg p-4">
                <p className="text-sm text-red-700">
                  We encountered an issue confirming your payment. Please try again or contact our support team.
                </p>
              </div>

              <div className="space-y-2">
                <Button onClick={() => navigate("/pricing")} variant="outline" className="w-full gap-2">
                  <Home className="h-4 w-4" />
                  Back to Pricing
                </Button>
                <Button onClick={() => navigate("/dashboard")} className="w-full gap-2">
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {status === "loading" && (
            <div className="text-center text-sm text-muted-foreground">
              <p>Order ID: <span className="font-mono text-xs">{orderId}</span></p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
