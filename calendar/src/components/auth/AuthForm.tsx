import { useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthFormProps {
  mode: "signin" | "signup";
  onSubmit: (email: string, password: string) => Promise<string | null>;
}

const COPY = {
  signin: {
    title: "Sign in",
    lede: "Welcome back. Your calendar is where you left it.",
    action: "Sign in",
    altPrompt: "Need an account?",
    altLabel: "Create one",
    altHref: "/signup",
  },
  signup: {
    title: "Create your account",
    lede: "Everything stays on this machine — accounts, calendars, and the AI.",
    action: "Create account",
    altPrompt: "Already registered?",
    altLabel: "Sign in",
    altHref: "/signin",
  },
} as const;

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const copy = COPY[mode];
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;

    setError(null);
    setSubmitting(true);
    const message = await onSubmit(email.trim(), password);
    if (message) setError(message);
    setSubmitting(false);
  };

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-3xl font-semibold text-foreground mb-2">{copy.title}</h1>
      <p className="text-muted-foreground mb-8">{copy.lede}</p>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-bold text-foreground mb-1.5">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@purdue.edu"
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground
                       placeholder:text-muted-foreground/70 text-sm
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                       transition-colors"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-bold text-foreground mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            aria-describedby={mode === "signup" ? "password-help" : undefined}
            className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground
                       placeholder:text-muted-foreground/70 text-sm
                       focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0
                       transition-colors"
          />
          {mode === "signup" && (
            <p id="password-help" className="mt-1.5 text-sm text-muted-foreground">
              At least 8 characters.
            </p>
          )}
        </div>

        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Working…
            </>
          ) : (
            copy.action
          )}
        </Button>
      </form>

      <p className="mt-6 text-sm text-muted-foreground">
        {copy.altPrompt}{" "}
        <Link to={copy.altHref} className="font-bold text-primary underline underline-offset-4">
          {copy.altLabel}
        </Link>
      </p>

      <Link
        to="/"
        className="mt-8 inline-block text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Back to home
      </Link>
    </div>
  );
}
