import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/axios";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const fill = (as: "student" | "admin") => {
    setEmail(as === "student" ? "student@campusos.edu" : "admin@campusos.edu");
    setPassword("campus123");
  };

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back"
      subtitle="Use your campus credentials to reach your schedule, rooms and the agent."
      footer={
        <>
          No account yet?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@campusos.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>

        <div className="border-t border-ink/10 pt-5">
          <div className="eyebrow mb-3 text-muted-foreground">Demo accounts</div>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fill("student")}>
              <GraduationCap />
              Student
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => fill("admin")}>
              <ShieldCheck />
              Admin
            </Button>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Admins can add, edit and delete records. Students see the agent refuse those same
            actions.
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
