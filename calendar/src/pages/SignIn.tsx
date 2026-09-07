import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthAside } from "@/components/auth/AuthAside";
import { useAuth } from "@/contexts/AuthContext";

export default function SignIn() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex bg-background">
      <AuthAside />
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <AuthForm
          mode="signin"
          onSubmit={async (email, password) => {
            const { error } = await signIn(email, password);
            if (error) return error.message;
            navigate("/calendar", { replace: true });
            return null;
          }}
        />
      </main>
    </div>
  );
}
