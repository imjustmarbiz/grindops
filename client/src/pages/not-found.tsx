import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4 border-0 bg-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-10 translate-x-10" />
        <CardContent className="pt-8 pb-8 px-6 relative">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/15 flex items-center justify-center mb-5">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white" data-testid="text-404-title">404</h1>
            <p className="text-lg font-medium text-white/60 mt-1" data-testid="text-404-subtitle">Page Not Found</p>
            <p className="mt-3 text-sm text-white/40 max-w-xs">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => window.history.back()}
                data-testid="button-go-back"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>
              <a href="/" data-testid="link-go-home">
                <Button
                  className="gap-2"
                  data-testid="button-go-home"
                >
                  <Home className="w-4 h-4" />
                  Home
                </Button>
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
