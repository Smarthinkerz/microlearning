import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RotateCcw } from "lucide-react";

export function CheckoutFailed() {
  const [location] = useLocation();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.split("?")[1]);
    setOrderId(searchParams.get("order_id"));
  }, [location]);

  const handleRetry = () => {
    window.location.href = "/pricing";
  };

  const handleDashboard = () => {
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-500/20">
        <CardHeader className="text-center">
          <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-red-600">Payment Failed</CardTitle>
          <CardDescription>We couldn't process your payment</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
              <p className="text-sm text-red-700 font-medium mb-2">What happened?</p>
              <ul className="text-sm text-red-600 space-y-1 list-disc list-inside">
                <li>Your payment was declined by the payment processor</li>
                <li>Please check your card details and try again</li>
                <li>Contact your bank if the issue persists</li>
              </ul>
            </div>

            {orderId && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Order ID</p>
                <p className="font-mono text-xs mt-1 break-all">{orderId}</p>
              </div>
            )}

            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <p className="text-sm text-blue-700">
                <strong>Need help?</strong> Contact our support team at support@example.com
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={handleDashboard} variant="outline" className="w-full gap-2">
              <Home className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
