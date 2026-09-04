import type { User } from "./types";

export interface ParsedCourseCode {
  department: string;
  year: number;
  semester: number;
  courseNumber: string;
  levelLabel: string;
}

/**
 * Parses course code following standard curriculum rules (e.g. "CSE 4133" -> Year 4, Semester 1).
 * First digit of code is Year, second digit is Semester.
 */
export function parseCourseCode(code: string): ParsedCourseCode {
  const clean = (code || "").trim();
  const parts = clean.split(/\s+/);
  const department = parts[0] ? parts[0].toUpperCase() : "";
  const numStr = parts[1] || "";
  const digits = numStr.replace(/\D/g, "");

  const year = digits.length >= 1 ? parseInt(digits[0], 10) : 0;
  const semester = digits.length >= 2 ? parseInt(digits[1], 10) : 0;

  const yearNames = ["", "1st", "2nd", "3rd", "4th", "5th"];
  const semNames = ["", "1st", "2nd", "3rd"];

  const levelLabel =
    year > 0 && semester > 0
      ? `${yearNames[year] || `Y${year}`} Year, ${semNames[semester] || `S${semester}`} Sem`
      : "";

  return {
    department,
    year,
    semester,
    courseNumber: numStr,
    levelLabel,
  };
}

/**
 * Checks if a course code matches a student's year, semester, and department.
 */
export function isCourseInStudentSemester(courseCode: string, user?: User | null): boolean {
  if (!user || user.role === "admin") return true;

  const parsed = parseCourseCode(courseCode);
  const userYear = user.year ?? 4;
  const userSem = user.semester ?? 1;
  const userDept = (user.department ?? "CSE").toUpperCase();

  // Match year & semester
  const yearMatches = parsed.year === 0 || parsed.year === userYear;
  const semMatches = parsed.semester === 0 || parsed.semester === userSem;

  // Department check: matches student's department or is an approved inter-dept course (e.g. IPE for CSE)
  const deptMatches =
    !parsed.department ||
    parsed.department === userDept ||
    (userDept === "CSE" && parsed.department === "IPE");

  return yearMatches && semMatches && deptMatches;
}
