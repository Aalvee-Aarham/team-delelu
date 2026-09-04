import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { apiErrorMessage } from "@/lib/axios";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", student_id: "", section: "B" });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(form);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Create account"
      title="Join CampusOS"
      subtitle="Register once, then everything on campus follows your section and student ID."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div className="grid gap-2">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" autoComplete="name" value={form.name} onChange={set("name")} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="student_id">Student ID</Label>
            <Input
              id="student_id"
              placeholder="20-40532"
              value={form.student_id}
              onChange={set("student_id")}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="section">Section</Label>
            <Input id="section" placeholder="B" value={form.section} onChange={set("section")} required />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@campusos.edu"
            value={form.email}
            onChange={set("email")}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            value={form.password}
            onChange={set("password")}
            required
          />
          <span className="text-[11px] text-muted-foreground">At least six characters.</span>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={busy}>
          {busy ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthLayout>
  );
}
