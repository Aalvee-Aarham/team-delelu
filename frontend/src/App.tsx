import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Shell } from "@/components/Shell";
import { BrandMark } from "@/components/Brand";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import SchedulesPage from "@/pages/SchedulesPage";
import RoomsPage from "@/pages/RoomsPage";
import EventsPage from "@/pages/EventsPage";
import AnnouncementsPage from "@/pages/AnnouncementsPage";
import AssignmentsPage from "@/pages/AssignmentsPage";
import AssignmentDetailPage from "@/pages/AssignmentDetailPage";
import CoursesPage from "@/pages/CoursesPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import SubmissionsPage from "@/pages/SubmissionsPage";
import ChatPage from "@/pages/ChatPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grain relative flex h-full flex-col items-center justify-center gap-4 bg-paper">
        <BrandMark className="h-11 w-11 animate-pulse" />
        <span className="eyebrow text-muted-foreground">Loading CampusOS</span>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/schedules" element={<SchedulesPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/assignments" element={<AssignmentsPage />} />
        <Route path="/assignments/:assignmentId" element={<AssignmentDetailPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/submissions" element={<SubmissionsPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Shell>
  );
}
