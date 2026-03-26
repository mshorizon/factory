import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Capture in Sentry if available
    try {
      import("@sentry/astro").then((Sentry) => {
        Sentry.captureException(error, {
          contexts: { react: { componentStack: errorInfo.componentStack } },
        });
      });
    } catch {
      // Sentry not available, ignore
    }
    console.error("React ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex items-center justify-center min-h-[200px] p-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-destructive mb-2">
                Coś poszło nie tak
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Wystąpił nieoczekiwany błąd. Odśwież stronę lub spróbuj ponownie.
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="text-sm underline text-primary hover:text-primary/80"
              >
                Spróbuj ponownie
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
