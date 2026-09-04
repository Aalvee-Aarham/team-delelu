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
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    student_id: "",
    section: "B",
    department: "CSE",
    year: 4,
    semester: 1,
  });
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({
      ...f,
      [key]: key === "year" || key === "semester" ? parseInt(e.target.value, 10) : e.target.value,
    }));

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
      subtitle="Register once, then courses, timetable and coursework follow your department, year, semester and student ID."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
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
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              value={form.department}
              onChange={set("department")}
              className="flex h-9 w-full rounded-md border border-ink/20 bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="CSE">CSE (Computer Science)</option>
              <option value="EEE">EEE (Electrical)</option>
              <option value="CE">CE (Civil)</option>
              <option value="ME">ME (Mechanical)</option>
              <option value="IPE">IPE (Industrial)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="grid gap-2">
            <Label htmlFor="year">Year</Label>
            <select
              id="year"
              value={form.year}
              onChange={set("year")}
              className="flex h-9 w-full rounded-md border border-ink/20 bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={1}>1st Year</option>
              <option value={2}>2nd Year</option>
              <option value={3}>3rd Year</option>
              <option value={4}>4th Year</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="semester">Semester</Label>
            <select
              id="semester"
              value={form.semester}
              onChange={set("semester")}
              className="flex h-9 w-full rounded-md border border-ink/20 bg-card px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value={1}>1st Sem</option>
              <option value={2}>2nd Sem</option>
            </select>
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
