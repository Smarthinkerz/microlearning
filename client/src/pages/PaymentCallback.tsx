import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export function PaymentCallback() {
  const [location] = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "failed" | "error">("loading");
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  const verifyPaymentMutation = trpc.subscription.verifyPayment.useMutation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Parse query parameters from URL
        const params = new URLSearchParams(location.split("?")[1]);
        const paymentStatus = params.get("status");
        const orderIdParam = params.get("order_id");
        const tapId = params.get("tap_id");
        const externalRef = params.get("external_ref");

        // Validate required parameters
        if (!paymentStatus || !orderIdParam) {
          setStatus("error");
          setMessage("Invalid payment callback: missing required parameters");
          return;
        }

        setOrderId(orderIdParam);

        // Handle different payment statuses
        if (paymentStatus === "paid") {
          // Verify payment with backend
          const result = await verifyPaymentMutation.mutateAsync({
            orderId: orderIdParam,
            tapId: tapId || "",
            externalRef: externalRef || "",
          });

          if (result.success) {
            setStatus("success");
            setMessage("Payment successful! Your subscription is now active.");
            
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              navigate("/dashboard");
            }, 3000);
          } else {
            setStatus("error");
            setMessage(result.message || "Payment verification failed. Please contact support.");
          }
        } else if (paymentStatus === "failed") {
          setStatus("failed");
          setMessage("Payment failed. Please try again or contact support.");
        } else if (paymentStatus === "cancelled") {
          setStatus("failed");
          setMessage("Payment was cancelled. No charges have been made.");
        } else {
          setStatus("error");
          setMessage(`Unknown payment status: ${paymentStatus}`);
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage("An error occurred while verifying your payment. Please contact support.");
      }
    };

    if (user) {
      verifyPayment();
    } else {
      // Redirect to login if not authenticated
      navigate("/");
    }
  }, [location, user, navigate, verifyPaymentMutation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Payment Processing</CardTitle>
          <CardDescription>
            {status === "loading" && "Verifying your payment..."}
            {status === "success" && "Payment Successful"}
            {status === "failed" && "Payment Failed"}
            {status === "error" && "Error Processing Payment"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Icon and Message */}
          <div className="flex flex-col items-center space-y-4">
            {status === "loading" && (
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="w-12 h-12 text-green-500" />
            )}
            {status === "failed" && (
              <XCircle className="w-12 h-12 text-red-500" />
            )}
            {status === "error" && (
              <AlertCircle className="w-12 h-12 text-amber-500" />
            )}

            <p className="text-center text-sm text-muted-foreground">{message}</p>
          </div>

          {/* Order ID Display */}
          {orderId && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">Order ID</p>
              <p className="text-sm font-mono font-semibold break-all">{orderId}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {status === "success" && (
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Go to Dashboard
              </Button>
            )}

            {status === "failed" && (
              <>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="w-full"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <Button
                  onClick={() => navigate("/pricing")}
                  className="w-full"
                >
                  Return to Pricing
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  variant="outline"
                  className="w-full"
                >
                  Back to Home
                </Button>
              </>
            )}
          </div>

          {/* Support Message */}
          {(status === "failed" || status === "error") && (
            <div className="bg-muted p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">
                Need help? Contact our support team at support@smarthinkerz.com
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
