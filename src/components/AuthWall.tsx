import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";

export default function AuthWall({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) return <>{children}</>;

  if (!user) {
    return (
      <div className="relative">
        <div className="blur-md pointer-events-none select-none opacity-60">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-card/95 backdrop-blur-sm border border-border rounded-2xl p-8 text-center max-w-sm mx-4 shadow-xl">
            <Lock className="h-10 w-10 text-primary mx-auto mb-3" />
            <h3 className="font-display font-bold text-xl text-foreground mb-2">Sign in to access</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create an account or sign in to view this content
            </p>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-display font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
