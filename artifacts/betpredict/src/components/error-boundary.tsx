import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render-time errors anywhere below it and shows a contained message
 * instead of letting React unmount the whole tree (which previously left a
 * blank/black screen when, e.g., the API returned an unexpected payload).
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Surface the error for debugging; the boundary keeps the app usable.
    console.error("Render error caught by ErrorBoundary:", error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">Something went wrong</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              This view failed to render. The API may be unavailable or returned
              unexpected data. Try reloading — if it persists, the backend may be
              offline.
            </p>
          </div>
          <pre className="max-w-md overflow-auto rounded-md bg-card px-3 py-2 text-left text-xs text-muted-foreground">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2">
            <Button onClick={this.handleReset} variant="outline">
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
