import { Link } from "wouter";
import { AlertCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-6xl font-black text-white mb-2">404</h1>
      <h2 className="text-xl font-semibold text-white mb-2">Page not found</h2>
      <p className="text-muted-foreground text-sm mb-8 max-w-sm">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex items-center gap-3">
        <Link href="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2 border-border text-white">
          <ArrowLeft className="w-4 h-4" /> Go Back
        </Button>
      </div>
    </div>
  );
}
