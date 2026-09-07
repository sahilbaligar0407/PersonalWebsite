import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AnimatedForm } from "@/components/auth/AnimatedForm";
import { AnimatedCalendar } from "@/components/auth/AnimatedCalendar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      return;
    }
    navigate("/calendar", { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left: Animated calendar - hidden on small screens */}
      <div
        className={cn(
          "hidden lg:flex lg:w-1/2 h-screen items-center justify-center",
          "bg-secondary/30 border-r border-border"
        )}
      >
        <AnimatedCalendar />
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen px-4 lg:px-8">
        <AnimatedForm
          header="Create Account"
          subHeader="Sign up to save your calendar and use AI features."
          fields={[
            {
              label: "Email",
              type: "email",
              required: true,
              placeholder: "you@university.edu",
              value: email,
              onChange: (e) => setEmail(e.target.value),
            },
            {
              label: "Password",
              type: "password",
              required: true,
              placeholder: "••••••••",
              value: password,
              onChange: (e) => setPassword(e.target.value),
            },
          ]}
          submitButton="Sign Up"
          textVariantButton="Already have an account? Sign In"
          goTo={() => navigate("/signin")}
          onSubmit={handleSubmit}
          submitError={error ?? undefined}
          googleLogin="Sign up with Google"
        />
        <Link to="/" className="mt-6 text-sm text-muted-foreground hover:text-foreground">
          ← Back to home
        </Link>
      </div>
    </div>
  );
}
