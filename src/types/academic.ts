export type Role = "STUDENT" | "FACULTY" | "HOD" | "ADMIN";

export interface StudentProfileData {
  rollNumber: string;
  department: string;
  semester: number;
  batch: string;
  year?: string;
  section?: string;
}

export interface FacultyProfileData {
  vmNo: string;
  department: string;
  designation: string;
}

export interface HodProfileData {
  vmNo: string;
  department: string;
  designation: string;
}

export interface UserItem {
  id: string;
  vmNo?: string | null;
  email: string;
  name: string;
  role: Role;
  status: string;
  createdAt: string | Date;
  studentProfile?: StudentProfileData | null;
  facultyProfile?: FacultyProfileData | null;
  hodProfile?: HodProfileData | null;
}

export interface DeptItem {
  id: string;
  code: string;
  name: string;
  hodName?: string | null;
  createdAt?: string | Date;
}

export interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  departmentCode: string;
  classesTaking?: string[];
  facultiesHandling?: string[];
}

export interface TimetableSlot {
  id?: string;
  classId: string;
  dayOrder: string;
  period: number;
  timeRange: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomNo: string;
  vmsNo?: string | null;
}

export interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: "GENERAL" | "URGENT" | "EXAM" | string;
  audience: "ALL" | "STUDENT" | "FACULTY" | string;
  postedBy: string;
  createdAt: string | Date;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  dateString: string;
  dayOrder: string;
  period: number;
  subjectCode: string;
  facultyName: string;
  status: "PRESENT" | "ABSENT" | "ON_DUTY" | string;
  createdAt?: string | Date;
}

export interface DayOrderInfo {
  currentDayOrder: string;
  tomorrowDayOrder: string;
  doIndex: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
