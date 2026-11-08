"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Users, Building2, BookOpen, Megaphone, Calendar, Sun, Moon, Globe, GraduationCap, Briefcase, UserCircle, Shield, Save, Edit, ArrowRight, Trash2, FileSpreadsheet, UserPlus, FileText, X, Zap, LayoutGrid, Shuffle, UserCheck, Loader2, History, Search } from "lucide-react";
import AdminAgentChat from "@/components/AdminAgentChat";
import AdminTimetablePdfUpload from "@/components/AdminTimetablePdfUpload";
import AdminTimetableExcelUpload from "@/components/AdminTimetableExcelUpload";
import AdminUserExcelUpload from "@/components/AdminUserExcelUpload";
import CourseCatalog from "@/components/CourseCatalog";
import TeacherSubjectAllocation from "@/components/TeacherSubjectAllocation";
import OverallTimetable from "@/components/OverallTimetable";
import Clock from "@/components/Clock";
import AdminAutomationHub from "@/components/AdminAutomationHub";
import TimetableCalendarView from "@/components/TimetableCalendarView";

interface UserItem {
  id: string;
  vmNo?: string | null;
  email: string;
  name: string;
  role: string;
  status: string;
  createdAt: string;
  studentProfile?: {
    rollNumber: string;
    department: string;
    semester: number;
    batch: string;
    year?: string;
    section?: string;
  } | null;
  facultyProfile?: {
    vmNo: string;
    department: string;
    designation: string;
    subject1?: string | null;
    subject2?: string | null;
    lab1?: string | null;
    lab2?: string | null;
    additional1?: string | null;
    additional2?: string | null;
  } | null;
  hodProfile?: {
    vmNo: string;
    department: string;
    designation: string;
  } | null;
}
interface DeptItem { id: string; code: string; name: string; hodName?: string; }
interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  departmentCode: string;
  classesTaking?: string[];
  facultiesHandling?: string[];
  scheduleSlots?: {
    dayOrder: string;
    period: number;
    classId: string;
    facultyName: string;
    roomNo: string;
    timeRange: string;
  }[];
}
interface NoticeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  audience?: string;
  department?: string | null;
  targetStudentId?: string | null;
  postedBy?: string;
  authorId?: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
    role: string;
  } | null;
}
interface TimetableEntry {
  id?: string;
  classId?: string;
  dayOrder: string;
  period: number;
  timeRange: string;
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  roomNo: string;
  vmsNo?: string | null;
  semType?: string | null;
}


export default function AdminPage() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [activeTab, setActiveTab] = useState<"users" | "depts" | "subjects" | "teacher-allocations" | "notices" | "timetable" | "audit" | "upload-timetable" | "upload-users" | "automation">("users");
  const [automationSubTab, setAutomationSubTab] = useState<"engine" | "audit">("engine");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Role Subdivision Filter State
  const [userRoleSubdivision, setUserRoleSubdivision] = useState<"ALL" | "STUDENT" | "FACULTY" | "HOD" | "ADMIN">("ALL");

  // Selected User & Selected Subject for Side Drawers
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectItem | null>(null);
  const [targetAllocationCourse, setTargetAllocationCourse] = useState<SubjectItem | null>(null);

  // State loaded from DB
  const [users, setUsers] = useState<UserItem[]>([]);
  const [depts, setDepts] = useState<DeptItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Timetable State
  const [timetableMode, setTimetableMode] = useState<"faculty" | "class">("faculty");
  const [timetableSubTab, setTimetableSubTab] = useState<"schedule" | "allocations">("schedule");
  const [timetableUploadTab, setTimetableUploadTab] = useState<"excel" | "pdf-doc">("excel");
  const [importSubTab, setImportSubTab] = useState<"timetable" | "users">("timetable");
  const [timetableCalendarView, setTimetableCalendarView] = useState(false);
  const [selectedDept, setSelectedDept] = useState("CSE");
  const [selectedYear, setSelectedYear] = useState("II");
  const [selectedSection, setSelectedSection] = useState("A");
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [availableFaculty, setAvailableFaculty] = useState<{ name: string; vmsNo: string | null }[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [isEditingTimetable, setIsEditingTimetable] = useState(false);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [randomizingTimetable, setRandomizingTimetable] = useState(false);

  // Day Order Override State
  const [currentDayOrderIndex, setCurrentDayOrderIndex] = useState("0");
  const [updatingDayOrder, setUpdatingDayOrder] = useState(false);

  // Leave Management State
  const [todayStatus, setTodayStatus] = useState("REGULAR");
  const [tomorrowStatus, setTomorrowStatus] = useState("REGULAR");
  const [todayDateStr, setTodayDateStr] = useState("");
  const [tomorrowDateStr, setTomorrowDateStr] = useState("");
  const [updatingLeave, setUpdatingLeave] = useState(false);

  // Modals State
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [timetableHistoryVersions, setTimetableHistoryVersions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<any | null>(null);
  const [historyAcademicYear, setHistoryAcademicYear] = useState("2026-2027");
  const [historySemester, setHistorySemester] = useState<number>(3);
  const [historyChangeReason, setHistoryChangeReason] = useState("Next Year / Semester Transition");

  // History Modal Custom Filters (Academic Year, Odd/Even Sem, Dept, Year 1-4, Section)
  const [historyFilterAcadYear, setHistoryFilterAcadYear] = useState("ALL");
  const [historyFilterSemType, setHistoryFilterSemType] = useState<"ALL" | "ODD" | "EVEN">("ALL");
  const [historyFilterDept, setHistoryFilterDept] = useState("ALL");
  const [historyFilterYear, setHistoryFilterYear] = useState("ALL");
  const [historyFilterSection, setHistoryFilterSection] = useState("ALL");

  // User Timetable Modal State
  const [userTimetableModalUser, setUserTimetableModalUser] = useState<UserItem | null>(null);
  const [userTimetableMap, setUserTimetableMap] = useState<Record<string, TimetableEntry[]> | null>(null);
  const [loadingUserTimetable, setLoadingUserTimetable] = useState(false);
  const [userTimetableError, setUserTimetableError] = useState<string | null>(null);
  const [userTimetableClassId, setUserTimetableClassId] = useState<string>("");
  const [userTimetableFacultyName, setUserTimetableFacultyName] = useState<string>("");
  const [userTimetableRaw, setUserTimetableRaw] = useState<TimetableEntry[]>([]);
  const [modalSelectedClass, setModalSelectedClass] = useState<string>("");
  const [modalSelectedFaculty, setModalSelectedFaculty] = useState<string>("");

  // Helper to compute standard student class ID from profile
  const computeClassId = (profile?: UserItem["studentProfile"]): string => {
    if (!profile) return "II-CSE-A";
    let yr = profile.year;
    if (!yr && profile.semester) {
      if (profile.semester <= 2) yr = "I";
      else if (profile.semester <= 4) yr = "II";
      else if (profile.semester <= 6) yr = "III";
      else yr = "IV";
    }
    if (!yr) yr = "II";
    if (yr === "1") yr = "I";
    if (yr === "2") yr = "II";
    if (yr === "3") yr = "III";
    if (yr === "4") yr = "IV";

    let dept = (profile.department || "CSE").toUpperCase();
    if (dept.includes("COMPUTER SCIENCE") || dept.includes("CSE")) dept = "CSE";
    else if (dept.includes("INFORMATION") || dept.includes("IT")) dept = "IT";
    else if (dept.includes("ELECTRONICS") || dept.includes("ECE")) dept = "ECE";
    else if (dept.includes("MECHANICAL") || dept.includes("MECH")) dept = "MECH";
    else if (dept.includes("AI") || dept.includes("AIDS")) dept = "AIDS";
    else dept = dept.replace(/^B\.E\s+/i, "").replace(/[^A-Z]/g, "") || "CSE";

    const sec = (profile.section || "A").toUpperCase();
    return `${yr}-${dept}-${sec}`;
  };

  const transformToTimetableMap = (entries: TimetableEntry[]): Record<string, TimetableEntry[]> => {
    const map: Record<string, TimetableEntry[]> = {
      "I": [], "II": [], "III": [], "IV": [], "V": []
    };
    entries.forEach((e) => {
      const d = (e.dayOrder || "").toUpperCase().trim();
      if (map[d]) {
        map[d].push(e);
      }
    });
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.period - b.period);
    });
    return map;
  };

  const fetchTimetableHistory = async (overrideParams?: {
    acadYear?: string;
    semType?: string;
    dept?: string;
    year?: string;
    sec?: string;
  }) => {
    setLoadingHistory(true);
    try {
      const aYear = overrideParams?.acadYear ?? historyFilterAcadYear;
      const sType = overrideParams?.semType ?? historyFilterSemType;
      const d = overrideParams?.dept ?? historyFilterDept;
      const y = overrideParams?.year ?? historyFilterYear;
      const s = overrideParams?.sec ?? historyFilterSection;

      let targetClassId = "";
      if (y !== "ALL" && d !== "ALL" && s !== "ALL") {
        targetClassId = `${y}-${d}-${s}`;
      } else if (y !== "ALL" || d !== "ALL" || s !== "ALL") {
        const parts = [
          y !== "ALL" ? y : selectedYear,
          d !== "ALL" ? d : selectedDept,
          s !== "ALL" ? s : selectedSection,
        ];
        targetClassId = parts.join("-");
      } else {
        targetClassId = `${selectedYear}-${selectedDept}-${selectedSection}`;
      }

      const queryParams = new URLSearchParams({
        history: "true",
      });

      if (targetClassId) queryParams.set("classId", targetClassId);
      if (aYear && aYear !== "ALL") queryParams.set("academicYear", aYear);
      if (sType && sType !== "ALL") queryParams.set("semesterType", sType);

      const res = await fetch(`/api/admin/timetable?${queryParams.toString()}`).then((r) => r.json());
      if (res.success) {
        setTimetableHistoryVersions(res.versions || []);
        if (res.versions && res.versions.length > 0) {
          setSelectedHistoryVersion(res.versions[0]);
        } else {
          setSelectedHistoryVersion(null);
        }
      } else {
        alert("Failed to load history: " + res.error);
      }
    } catch (e: any) {
      alert("Error loading history: " + e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openUserTimetable = async (u: UserItem) => {
    setUserTimetableModalUser(u);
    setLoadingUserTimetable(true);
    setUserTimetableError(null);
    setUserTimetableMap(null);
    setUserTimetableRaw([]);

    try {
      if (u.role === "STUDENT") {
        const classId = computeClassId(u.studentProfile);
        setUserTimetableClassId(classId);
        setModalSelectedClass(classId);
        setUserTimetableFacultyName("");

        const res = await fetch(`/api/admin/timetable?classId=${encodeURIComponent(classId)}`).then(r => r.json());
        if (res.success) {
          const list = res.timetable || [];
          setUserTimetableRaw(list);
          setUserTimetableMap(transformToTimetableMap(list));
          if (list.length === 0) {
            setUserTimetableError(`No schedule records found in master timetable for class ${classId}.`);
          }
        } else {
          setUserTimetableError(res.error || "Failed to load class timetable.");
        }
      } else if (u.role === "FACULTY" || u.role === "HOD") {
        const vmNo = u.facultyProfile?.vmNo || u.vmNo;
        let queryTarget = vmNo || u.name;

        // Check if there is a match in availableFaculty
        if (availableFaculty && availableFaculty.length > 0) {
          const vmMatch = vmNo ? availableFaculty.find(f => f.vmsNo && f.vmsNo.trim() === vmNo.trim()) : null;
          if (vmMatch) {
            queryTarget = vmMatch.name;
          } else {
            const cleanUName = u.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+/i, '').toLowerCase().trim();
            const nameMatch = availableFaculty.find(f => {
              const cleanFName = f.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?|Prof\.?)\s+/i, '').toLowerCase().trim();
              return cleanFName.includes(cleanUName) || cleanUName.includes(cleanFName);
            });
            if (nameMatch) {
              queryTarget = nameMatch.name;
            }
          }
        }

        setUserTimetableFacultyName(queryTarget);
        setModalSelectedFaculty(queryTarget);
        setUserTimetableClassId("");

        const res = await fetch(`/api/admin/timetable?facultyName=${encodeURIComponent(queryTarget)}`).then(r => r.json());
        if (res.success && res.timetable && res.timetable.length > 0) {
          setUserTimetableRaw(res.timetable);
          setUserTimetableMap(transformToTimetableMap(res.timetable));
        } else {
          // If 0 entries found with name, try fallback with vmNo
          if (vmNo && queryTarget !== vmNo) {
            const fallbackRes = await fetch(`/api/admin/timetable?facultyName=${encodeURIComponent(vmNo)}`).then(r => r.json());
            if (fallbackRes.success && fallbackRes.timetable && fallbackRes.timetable.length > 0) {
              setUserTimetableRaw(fallbackRes.timetable);
              setUserTimetableMap(transformToTimetableMap(fallbackRes.timetable));
              setUserTimetableFacultyName(`${u.name} (VMS: ${vmNo})`);
              setLoadingUserTimetable(false);
              return;
            }
          }
          setUserTimetableRaw([]);
          setUserTimetableMap(transformToTimetableMap([]));
          setUserTimetableError(`No teaching schedule found for faculty "${queryTarget}".`);
        }
      } else {
        setUserTimetableError("ADMIN_ROLE");
      }
    } catch (err: any) {
      setUserTimetableError(err.message || "Network error loading user timetable.");
    } finally {
      setLoadingUserTimetable(false);
    }
  };

  const handleModalClassChange = async (newClassId: string) => {
    setModalSelectedClass(newClassId);
    setUserTimetableClassId(newClassId);
    setLoadingUserTimetable(true);
    setUserTimetableError(null);
    try {
      const res = await fetch(`/api/admin/timetable?classId=${encodeURIComponent(newClassId)}`).then(r => r.json());
      if (res.success) {
        const list = res.timetable || [];
        setUserTimetableRaw(list);
        setUserTimetableMap(transformToTimetableMap(list));
        if (list.length === 0) {
          setUserTimetableError(`No schedule records found for class ${newClassId}.`);
        }
      } else {
        setUserTimetableError(res.error || "Failed to load class timetable.");
      }
    } catch (err: any) {
      setUserTimetableError(err.message || "Failed to fetch class timetable.");
    } finally {
      setLoadingUserTimetable(false);
    }
  };

  const handleModalFacultyChange = async (newFacultyName: string) => {
    setModalSelectedFaculty(newFacultyName);
    setUserTimetableFacultyName(newFacultyName);
    setLoadingUserTimetable(true);
    setUserTimetableError(null);
    try {
      const res = await fetch(`/api/admin/timetable?facultyName=${encodeURIComponent(newFacultyName)}`).then(r => r.json());
      if (res.success) {
        const list = res.timetable || [];
        setUserTimetableRaw(list);
        setUserTimetableMap(transformToTimetableMap(list));
        if (list.length === 0) {
          setUserTimetableError(`No schedule records found for faculty "${newFacultyName}".`);
        }
      } else {
        setUserTimetableError(res.error || "Failed to load faculty schedule.");
      }
    } catch (err: any) {
      setUserTimetableError(err.message || "Failed to fetch faculty schedule.");
    } finally {
      setLoadingUserTimetable(false);
    }
  };

  const jumpToTimetableTab = (targetType: "class" | "faculty", value: string) => {
    setUserTimetableModalUser(null);
    setActiveTab("timetable");
    if (targetType === "class") {
      setTimetableMode("class");
      const parts = value.split("-");
      if (parts.length >= 3) {
        setSelectedYear(parts[0]);
        setSelectedDept(parts[1]);
        setSelectedSection(parts[2]);
      }
      setTimeout(() => {
        fetch(`/api/admin/timetable?classId=${encodeURIComponent(value)}`)
          .then(r => r.json())
          .then(res => {
            if (res.success && res.timetable) setTimetable(res.timetable);
          });
      }, 100);
    } else {
      setTimetableMode("faculty");
      setSelectedFaculty(value);
      setTimeout(() => {
        fetch(`/api/admin/timetable?facultyName=${encodeURIComponent(value)}`)
          .then(r => r.json())
          .then(res => {
            if (res.success && res.timetable) setTimetable(res.timetable);
          });
      }, 100);
    }
  };

  // User Form
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserPass, setNewUserPass] = useState("");
  const [newUserRole, setNewUserRole] = useState("STUDENT");
  const [newUserVmNo, setNewUserVmNo] = useState("");
  const [newUserDept, setNewUserDept] = useState("CSE");
  const [newUserYear, setNewUserYear] = useState("I");
  const [newUserSection, setNewUserSection] = useState("A");
  const [newUserDesignation, setNewUserDesignation] = useState("Assistant Professor");

  // Dept Form
  const [newDeptCode, setNewDeptCode] = useState("");
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptHod, setNewDeptHod] = useState("");
  const [newDeptHodVmNo, setNewDeptHodVmNo] = useState("");

  // Subject Form
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCredits, setNewSubCredits] = useState("3");
  const [newSubSem, setNewSubSem] = useState("5");
  const [newSubDept, setNewSubDept] = useState("CSE");

  // Notice Form
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [newNoticeCategory, setNewNoticeCategory] = useState("GENERAL");
  const [newNoticeAudience, setNewNoticeAudience] = useState("ALL");
  const [newNoticeDept, setNewNoticeDept] = useState("");


  // Apply Theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  // Fetch all data
  const fetchData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setIsSyncing(true);
    }
    try {
      const safeFetch = async (url: string) => {
        try {
          const res = await fetch(url, { cache: "no-store" });
          if (!res.ok) {
            console.warn(`[Admin Fetch] HTTP ${res.status} for ${url}`);
            return { success: false, status: res.status };
          }
          return await res.json();
        } catch (e: any) {
          console.error(`[Admin Fetch Error] ${url}:`, e?.message || e);
          return { success: false, error: e?.message };
        }
      };

      const [uRes, dRes, sRes, nRes, doRes, lRes, aRes] = await Promise.all([
        safeFetch("/api/admin/users"),
        safeFetch("/api/admin/departments"),
        safeFetch("/api/admin/subjects"),
        safeFetch("/api/admin/notices"),
        safeFetch("/api/admin/day-order"),
        safeFetch("/api/admin/leaves"),
        safeFetch("/api/admin/audit-logs"),
      ]);

      if (uRes?.success && Array.isArray(uRes.users)) setUsers(uRes.users);
      if (dRes?.success && Array.isArray(dRes.departments)) setDepts(dRes.departments);
      if (sRes?.success && Array.isArray(sRes.subjects)) setSubjects(sRes.subjects);
      if (nRes?.success && Array.isArray(nRes.notices)) setNotices(nRes.notices);
      if (aRes?.success && Array.isArray(aRes.logs)) setAuditLogs(aRes.logs);
      if (doRes?.success && doRes.data) setCurrentDayOrderIndex(doRes.data.baseIndex.toString());
      if (lRes?.success && lRes.data) {
        setTodayStatus(lRes.data.today);
        setTomorrowStatus(lRes.data.tomorrow);
        setTodayDateStr(lRes.data.todayDate);
        setTomorrowDateStr(lRes.data.tomorrowDate);
      }

      // Fetch timetable options (available classes & faculty)
      try {
        const ttOpt = await safeFetch("/api/admin/timetable?list=options");
        if (ttOpt?.success && ttOpt.options) {
          setAvailableFaculty(ttOpt.options.faculty || []);
          if (ttOpt.options.faculty?.length > 0 && !selectedFaculty) {
            setSelectedFaculty(ttOpt.options.faculty[0].name);
          }
        }
      } catch (e) {
        console.error("Error fetching timetable options:", e);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => { 
    fetchData(false); 
  }, []);

  // Filter users by active subdivision (including ADMIN accounts)
  const allDisplayUsers = users;

  // Filter users by active subdivision
  const filteredUsers = allDisplayUsers.filter((u) => {
    if (userRoleSubdivision === "ALL") return true;
    return u.role === userRoleSubdivision;
  });

  // Handlers with Optimistic Updates & Smooth Background Sync
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    const email = newUserEmail.toLowerCase().trim();
    const name = newUserName.trim();
    const password = newUserPass;
    const role = newUserRole;
    const vmNo = newUserVmNo.trim();
    const dept = newUserDept;
    const year = newUserYear;
    const section = newUserSection;
    const designation = newUserDesignation;

    // Optimistic user object preview
    const tempUser: UserItem = {
      id: `temp-${Date.now()}`,
      email,
      name,
      role,
      status: "ACTIVE",
      vmNo: vmNo || null,
      createdAt: new Date().toISOString(),
      studentProfile: role === "STUDENT" ? {
        rollNumber: vmNo,
        department: dept,
        semester: 3,
        batch: "2023-2027",
        year,
        section,
      } : null,
      facultyProfile: role === "FACULTY" ? {
        vmNo,
        department: dept,
        designation,
      } : null,
      hodProfile: role === "HOD" ? {
        vmNo,
        department: dept,
        designation: designation || `Head of Department (${dept})`,
      } : null,
    };

    // Update state immediately without loading screen
    setUsers((prev) => [tempUser, ...prev]);
    setShowUserModal(false);
    setNewUserEmail("");
    setNewUserName("");
    setNewUserPass("");
    setNewUserVmNo("");
    setNewUserDesignation("Assistant Professor");

    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        name,
        password,
        role,
        vmNo,
        department: dept,
        year,
        section,
        designation,
      }),
    }).then((r) => r.json());

    if (res.success) {
      fetchData(true); // silent background reconcile
    } else {
      // Rollback on failure
      setUsers((prev) => prev.filter((u) => u.id !== tempUser.id));
      alert("Error creating user: " + (res.error || "Failed to create user"));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    const previousUsers = [...users];
    // Immediate optimistic removal
    setUsers((prev) => prev.filter((u) => u.id !== id));
    if (selectedUser?.id === id) setSelectedUser(null);

    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      fetchData(true); // silent sync
    } else {
      setUsers(previousUsers); // rollback
      alert("Error: " + res.error);
    }
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempDept: DeptItem = {
      id: `temp-dept-${Date.now()}`,
      code: newDeptCode.toUpperCase().trim(),
      name: newDeptName.trim(),
      hodName: newDeptHod.trim() || undefined,
    };

    setDepts((prev) => [...prev, tempDept]);
    setShowDeptModal(false);
    const code = newDeptCode;
    const name = newDeptName;
    const hodVmNo = newDeptHodVmNo;
    const hodName = newDeptHod;
    setNewDeptCode("");
    setNewDeptName("");
    setNewDeptHod("");
    setNewDeptHodVmNo("");

    const res = await fetch("/api/admin/departments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        code, 
        name, 
        hodVmNo,
        hodName 
      }),
    }).then((r) => r.json());

    if (res.success) { 
      fetchData(true); // silent background reconcile
    } else {
      setDepts((prev) => prev.filter((d) => d.id !== tempDept.id));
      alert("Error: " + res.error);
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (!confirm("Delete department?")) return;
    const previousDepts = [...depts];
    setDepts((prev) => prev.filter((d) => d.id !== id));

    const res = await fetch(`/api/admin/departments?id=${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      fetchData(true);
    } else {
      setDepts(previousDepts);
      alert("Error: " + res.error);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempSub: SubjectItem = {
      id: `temp-sub-${Date.now()}`,
      code: newSubCode.toUpperCase().trim(),
      name: newSubName.trim(),
      credits: parseInt(newSubCredits, 10) || 3,
      semester: parseInt(newSubSem, 10) || 5,
      departmentCode: newSubDept,
    };

    setSubjects((prev) => [...prev, tempSub]);
    setShowSubjectModal(false);
    const code = newSubCode;
    const name = newSubName;
    const credits = newSubCredits;
    const semester = newSubSem;
    const departmentCode = newSubDept;
    setNewSubCode("");
    setNewSubName("");

    const res = await fetch("/api/admin/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name, credits, semester, departmentCode }),
    }).then((r) => r.json());

    if (res.success) { 
      fetchData(true); 
    } else {
      setSubjects((prev) => prev.filter((s) => s.id !== tempSub.id));
      alert("Error: " + res.error);
    }
  };

  const handleDeleteSubject = async (id: string) => {
    if (!confirm("Delete subject?")) return;
    const prevSubs = [...subjects];
    setSubjects((prev) => prev.filter((s) => s.id !== id));

    const res = await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      fetchData(true);
    } else {
      setSubjects(prevSubs);
      alert("Error: " + res.error);
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    const tempNotice: NoticeItem = {
      id: `temp-notice-${Date.now()}`,
      title: newNoticeTitle.trim(),
      content: newNoticeContent.trim(),
      category: newNoticeCategory,
      audience: newNoticeAudience,
      department: newNoticeDept ? newNoticeDept : null,
      postedBy: "Admin",
      createdAt: new Date().toISOString(),
    };

    setNotices((prev) => [tempNotice, ...prev]);
    setShowNoticeModal(false);
    const title = newNoticeTitle;
    const content = newNoticeContent;
    const category = newNoticeCategory;
    const audience = newNoticeAudience;
    const department = newNoticeDept;
    setNewNoticeTitle("");
    setNewNoticeContent("");
    setNewNoticeAudience("ALL");
    setNewNoticeDept("");

    const res = await fetch("/api/admin/notices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content, category, audience, department }),
    }).then((r) => r.json());

    if (res.success) { 
      fetchData(true); 
    } else {
      setNotices((prev) => prev.filter((n) => n.id !== tempNotice.id));
      alert("Error: " + res.error);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Delete notice?")) return;
    const prevNotices = [...notices];
    setNotices((prev) => prev.filter((n) => n.id !== id));

    const res = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" }).then((r) => r.json());
    if (res.success) {
      fetchData(true);
    } else {
      setNotices(prevNotices);
      alert("Error: " + res.error);
    }
  };

  const handleUpdateDayOrder = async () => {
    setUpdatingDayOrder(true);
    const res = await fetch("/api/admin/day-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ index: parseInt(currentDayOrderIndex, 10) })
    }).then(r => r.json());

    if (res.success) {
      fetchData(true);
    } else {
      alert("Error updating day order: " + res.error);
    }
    setUpdatingDayOrder(false);
  };

  const handleUpdateLeave = async (target: 'today' | 'tomorrow', status: string) => {
    if (target === 'today') setTodayStatus(status);
    else setTomorrowStatus(status);
    setUpdatingLeave(true);
    const res = await fetch("/api/admin/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target, status })
    }).then(r => r.json());

    if (res.success) {
      fetchData(true);
    } else {
      alert("Error updating status: " + res.error);
    }
    setUpdatingLeave(false);
  };




  return (
    <div className="admin-layout">
      {/* MOBILE SIDEBAR OVERLAY */}
      <div className={`admin-sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`} onClick={() => setIsMobileSidebarOpen(false)} />

      {/* LEFT SIDEBAR */}
      <aside className={`admin-sidebar ${isMobileSidebarOpen ? 'open' : ''}`}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", paddingBottom: "1.5rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "6px", backgroundColor: "var(--royal-blue)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "1.05rem", color: "white", boxShadow: "0 2px 6px rgba(11, 93, 82, 0.3)" }}>
              in
            </div>
            <div>
              <h2 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, letterSpacing: "-0.01em" }}>VM-HUB</h2>
              <span style={{ fontSize: "0.725rem", color: "var(--royal-blue)", fontWeight: "600" }}>Admin Portal</span>
            </div>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {[
              { id: "users", label: "User Accounts", Icon: Users, count: allDisplayUsers.length },
              { id: "depts", label: "Departments", Icon: Building2, count: depts.length },
              { id: "subjects", label: "Course Catalog", Icon: BookOpen, count: subjects.length },
              { id: "timetable", label: "Timetable & Staff Allocation", Icon: Calendar, count: subjects.length },
              { id: "notices", label: "Announcements", Icon: Megaphone, count: notices.length },
              { id: "upload-timetable", label: "Import & Onboarding Deck", Icon: FileText, count: 0 },
              { id: "automation", label: "Automation & Audit Hub", Icon: Zap, count: auditLogs.length },
            ].map((nav) => {
              const isSelected =
                (nav.id === "timetable" && (activeTab === "timetable" || activeTab === "teacher-allocations")) ||
                (activeTab === nav.id && nav.id !== "timetable") ||
                (nav.id === "upload-timetable" && activeTab === "upload-users") ||
                (nav.id === "automation" && activeTab === "audit");

              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    if (nav.id === "timetable") {
                      setActiveTab("timetable");
                    } else {
                      setActiveTab(nav.id as any);
                    }
                    setSelectedUser(null);
                  }}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "0.65rem 0.9rem",
                    borderRadius: "6px",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: isSelected ? "700" : "600",
                    fontSize: "0.85rem",
                    backgroundColor: isSelected ? "rgba(11, 93, 82, 0.1)" : "transparent",
                    color: isSelected ? "var(--royal-blue)" : "var(--text-muted)",
                    borderLeft: isSelected ? "3px solid var(--royal-blue)" : "3px solid transparent",
                    transition: "all 0.2s ease"
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                    <nav.Icon size={17} style={{ color: isSelected ? "var(--royal-blue)" : "inherit" }} /> {nav.label}
                  </span>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      padding: "0.15rem 0.5rem",
                      borderRadius: "9999px",
                      backgroundColor: isSelected ? "rgba(11, 93, 82, 0.18)" : "var(--border-subtle)",
                      color: isSelected ? "var(--royal-blue)" : "var(--text-muted)",
                      fontWeight: isSelected ? "700" : "500"
                    }}
                  >
                    {nav.count}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {/* User Profile Sidebar Card */}
          <div
            onClick={() => {
              // Find or create current admin user profile to display in drawer
              const currentAdmin = users.find((u) => u.role === "ADMIN") || {
                id: "admin-self",
                email: "admin@veltech.edu.in",
                name: "Administrator ( You )",
                role: "ADMIN",
                status: "ACTIVE",
                createdAt: new Date().toISOString(),
              };
              setSelectedUser(currentAdmin);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.6rem 0.75rem",
              borderRadius: "10px",
              backgroundColor: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              cursor: "pointer",
              transition: "all 0.2s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--sky-blue)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-subtle)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <div style={{
              width: "38px",
              height: "38px",
              borderRadius: "50%",
              backgroundColor: "var(--royal-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              color: "white",
              fontSize: "0.95rem",
              border: "2px solid rgba(255, 255, 255, 0.2)"
            }}>
              A
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: "0.85rem", fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", color: "var(--text-main)" }}>
                Admin Profile
              </div>
              <div style={{ fontSize: "0.725rem", color: "var(--text-muted)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                admin@vtmt.org
              </div>
            </div>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>›</span>
          </div>

          <button onClick={toggleTheme} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", width: "100%", backgroundColor: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-subtle)", padding: "0.6rem", borderRadius: "8px", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" }}>
            {theme === "dark" ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
          </button>
          <button onClick={() => signOut({ callbackUrl: "/" })} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", color: "#ef4444", fontSize: "0.85rem", border: "1px solid rgba(239, 68, 68, 0.3)", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "0.6rem", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        <header className="admin-header-container">
          <div className="admin-header-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <button className="hamburger-btn" onClick={() => setIsMobileSidebarOpen(true)}>
                ☰
              </button>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <h1 style={{ fontSize: "1.5rem", fontWeight: "700", margin: 0, fontFamily: "var(--font-serif, serif)" }}>
                    {activeTab === "users" && "User Directory & Role Subdivisions"}
                    {activeTab === "depts" && "Academic Departments"}
                    {activeTab === "subjects" && "Course & Subject Catalog"}
                    {(activeTab === "timetable" || activeTab === "teacher-allocations") && (
                      timetableSubTab === "allocations"
                        ? "Subject-Handling Teacher Staff Allocations & Class Setup"
                        : "Class Timetable & Schedule Management"
                    )}
                    {activeTab === "notices" && "System Announcements & Broadcasts"}
                    {(activeTab === "upload-timetable" || activeTab === "upload-users") && "Bulk Onboarding, Timetable Import & Official Templates"}
                    {(activeTab === "automation" || activeTab === "audit") && "Autonomous Operations, Diagnostics & Audit Trail"}
                  </h1>
                  {isSyncing && (
                    <span style={{ 
                      display: "inline-flex", 
                      alignItems: "center", 
                      gap: "0.35rem", 
                      fontSize: "0.75rem", 
                      padding: "0.2rem 0.6rem", 
                      borderRadius: "12px", 
                      backgroundColor: "rgba(11, 93, 82, 0.12)", 
                      color: "var(--royal-blue)", 
                      fontWeight: "600" 
                    }}>
                      <Loader2 size={12} className="spin" style={{ animation: "spin 1s linear infinite" }} /> Syncing...
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)" }}>Vel Tech Multi Tech Autonomous ERP System</p>
              </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
              <Clock size={90} subtext="CAMPUS" />
            </div>
          </div>
        </header>

        {loading && users.length === 0 && depts.length === 0 ? (
          <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
            <Loader2 size={32} style={{ animation: "spin 1s linear infinite", color: "var(--royal-blue)" }} />
            <span>Initializing database records...</span>
          </div>
        ) : (
          <>
            {/* USERS TABLE WITH CLICKABLE ROWS */}
            {activeTab === "users" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Registered Accounts</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Click any user row to open their full profile drawer</p>
                  </div>
                  <button onClick={() => setShowUserModal(true)} className="btn-royal">+ Add New User</button>
                </div>

                {/* ROLE SUBDIVISION PILLS */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem", backgroundColor: "var(--bg-card)", padding: "0.4rem 0.5rem", borderRadius: "24px", border: "1px solid var(--border-subtle)", flexWrap: "wrap", width: "fit-content" }}>
                  {[
                    { id: "ALL", label: "All Accounts", Icon: Globe, count: allDisplayUsers.length },
                    { id: "STUDENT", label: "Students", Icon: GraduationCap, count: allDisplayUsers.filter((u) => u.role === "STUDENT").length },
                    { id: "FACULTY", label: "Teachers / Faculty", Icon: Briefcase, count: allDisplayUsers.filter((u) => u.role === "FACULTY").length },
                    { id: "HOD", label: "HODs", Icon: UserCircle, count: allDisplayUsers.filter((u) => u.role === "HOD").length },
                    { id: "ADMIN", label: "Administrators", Icon: Shield, count: allDisplayUsers.filter((u) => u.role === "ADMIN").length },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => { setUserRoleSubdivision(sub.id as any); setSelectedUser(null); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.45rem 1rem",
                        borderRadius: "20px",
                        border: "none",
                        cursor: "pointer",
                        fontWeight: userRoleSubdivision === sub.id ? "700" : "600",
                        fontSize: "0.85rem",
                        backgroundColor: userRoleSubdivision === sub.id ? "var(--royal-blue)" : "transparent",
                        color: userRoleSubdivision === sub.id ? "#ffffff" : "var(--text-muted)",
                        boxShadow: userRoleSubdivision === sub.id ? "0 2px 6px rgba(11, 93, 82, 0.25)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><sub.Icon size={16} /> {sub.label}</span>
                      <span style={{ fontSize: "0.75rem", padding: "0.1rem 0.45rem", borderRadius: "9999px", backgroundColor: userRoleSubdivision === sub.id ? "rgba(255, 255, 255, 0.25)" : "var(--border-subtle)", color: userRoleSubdivision === sub.id ? "#ffffff" : "inherit" }}>
                        {sub.count}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="responsive-table-wrapper">
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem", minWidth: "600px" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-muted)" }}>
                        <th style={{ padding: "0.85rem 1rem" }}>User Name</th><th style={{ padding: "0.85rem 1rem" }}>Email Address</th><th style={{ padding: "0.85rem 1rem" }}>Subdivision Role</th><th style={{ padding: "0.85rem 1rem" }}>Status</th><th style={{ padding: "0.85rem 1rem" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>No accounts found in this role subdivision.</td></tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            style={{
                              borderBottom: "1px solid var(--border-subtle)",
                              cursor: "pointer",
                              backgroundColor: selectedUser?.id === u.id ? "rgba(11, 93, 82, 0.08)" : "transparent",
                              transition: "background-color 0.2s ease"
                            }}
                          >
                            <td style={{ padding: "0.85rem 1rem", fontWeight: "600" }}>{u.name}</td>
                            <td style={{ padding: "0.85rem 1rem", color: "var(--sky-blue)", fontWeight: "500" }}>{u.email}</td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "700", backgroundColor: u.role === "ADMIN" ? "rgba(239,68,68,0.15)" : u.role === "HOD" ? "rgba(245,158,11,0.15)" : u.role === "FACULTY" ? "rgba(16,185,129,0.15)" : "rgba(11,93,82,0.15)", color: u.role === "ADMIN" ? "#ef4444" : u.role === "HOD" ? "#d97706" : u.role === "FACULTY" ? "#059669" : "var(--royal-blue)" }}>
                                {u.role === "FACULTY" ? "TEACHER" : u.role}
                              </span>
                            </td>
                            <td style={{ padding: "0.85rem 1rem", color: "#10b981", fontWeight: "600" }}>● {u.status}</td>
                            <td style={{ padding: "0.85rem 1rem" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelectedUser(u); }}
                                  style={{
                                    backgroundColor: "rgba(11, 93, 82, 0.15)",
                                    color: "var(--sky-blue)",
                                    border: "1px solid rgba(11, 93, 82, 0.3)",
                                    padding: "0.3rem 0.75rem",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap"
                                  }}
                                >
                                  View Profile →
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); openUserTimetable(u); }}
                                  title={`View timetable for ${u.name}`}
                                  style={{
                                    backgroundColor: "rgba(11, 93, 82, 0.15)",
                                    color: "var(--sky-blue)",
                                    border: "1px solid rgba(11, 93, 82, 0.4)",
                                    padding: "0.3rem 0.75rem",
                                    borderRadius: "6px",
                                    fontSize: "0.8rem",
                                    fontWeight: "600",
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.15s ease"
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "var(--royal-blue)";
                                    e.currentTarget.style.color = "#ffffff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "rgba(11, 93, 82, 0.15)";
                                    e.currentTarget.style.color = "var(--sky-blue)";
                                  }}
                                >
                                  <Calendar size={13} /> Timetable
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* DEPARTMENTS */}
            {activeTab === "depts" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                  <div><h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Academic Departments</h3><p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Configured divisions and HODs</p></div>
                  <button onClick={() => setShowDeptModal(true)} className="btn-sky">+ Create Department</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {depts.map((d, idx) => {
                    const linkedHodUser = users.find((u) => {
                      if (!d.hodName && !u.vmNo) return false;
                      const matchName = d.hodName && u.name.toLowerCase().trim() === d.hodName.toLowerCase().trim();
                      const matchHodDept = (u.role === "HOD" || u.hodProfile) && (u.hodProfile?.department === d.code || (u as any).department === d.code);
                      return matchName || matchHodDept;
                    });

                    return (
                      <div key={d.id || d.code || `dept-${idx}`} style={{ backgroundColor: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-card)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "0.75rem", color: "var(--sky-blue)", fontWeight: "800", letterSpacing: "0.05em" }}>{d.code}</span>
                            {linkedHodUser && (
                              <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "4px", backgroundColor: "rgba(11, 93, 82, 0.12)", color: "var(--royal-blue)", fontWeight: "700" }}>
                                Linked Account
                              </span>
                            )}
                          </div>
                          <h3 style={{ fontSize: "1.2rem", fontWeight: "600", margin: "0.25rem 0 0.75rem 0" }}>{d.name}</h3>

                          {linkedHodUser ? (
                            <div 
                              onClick={() => setSelectedUser(linkedHodUser)}
                              title="Click to view HOD profile details"
                              style={{ 
                                display: "flex", 
                                alignItems: "center", 
                                gap: "0.6rem", 
                                padding: "0.5rem 0.75rem", 
                                backgroundColor: "var(--bg-input)", 
                                borderRadius: "8px", 
                                border: "1px solid var(--border-subtle)",
                                cursor: "pointer",
                                transition: "all 0.15s ease"
                              }}
                            >
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--royal-blue)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "700", fontSize: "0.85rem" }}>
                                {linkedHodUser.name.charAt(0)}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-main)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {linkedHodUser.name}
                                </div>
                                <div style={{ fontSize: "0.725rem", color: "var(--text-muted)" }}>
                                  MTS: {linkedHodUser.vmNo || "N/A"} • {linkedHodUser.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                              HOD: <strong style={{ color: "var(--text-main)" }}>{d.hodName || "Not Assigned"}</strong>
                            </p>
                          )}
                        </div>
                        <div style={{ marginTop: "1rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "flex-end" }}>
                          <button onClick={() => handleDeleteDept(d.id)} style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", padding: "0.25rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}>Delete Department</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SUBJECTS & COURSE CATALOG */}
            {activeTab === "subjects" && (
              <CourseCatalog
                mode="admin"
                departments={depts}
                onCourseUpdated={fetchData}
                onNavigateToAllocation={(course) => {
                  setTargetAllocationCourse(course);
                  setTimetableSubTab("allocations");
                  setActiveTab("timetable");
                }}
              />
            )}

            {/* NOTICES */}
            {activeTab === "notices" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                      Campus Announcements & Notices ({notices.length})
                    </h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                      Central repository of all announcements posted by Admins, HODs, and Faculty across departments.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowNoticeModal(true)} 
                    className="btn-sky"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "20px",
                      fontWeight: "700",
                      fontSize: "0.875rem"
                    }}
                  >
                    + Create Announcement
                  </button>
                </div>

                {notices.length === 0 ? (
                  <div style={{ 
                    backgroundColor: "var(--bg-card)", 
                    padding: "3rem 2rem", 
                    borderRadius: "12px", 
                    border: "1px solid var(--border-subtle)", 
                    textAlign: "center" 
                  }}>
                    <Megaphone size={40} style={{ color: "var(--text-muted)", margin: "0 auto 1rem auto", opacity: 0.6 }} />
                    <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "var(--text-main)" }}>No announcements published yet</h4>
                    <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Announcements posted by HODs, Faculty, or Admins will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
                    {notices.map((n) => {
                      const authorName = n.author?.name || n.postedBy || "Administrator";
                      const authorRole = n.author?.role || (n.postedBy?.toUpperCase().includes("HOD") ? "HOD" : n.postedBy?.toUpperCase().includes("FACULTY") ? "FACULTY" : "ADMIN");
                      const authorEmail = n.author?.email;

                      const roleBadgeBg = authorRole === "HOD" ? "rgba(245, 158, 11, 0.15)" : authorRole === "FACULTY" ? "rgba(16, 185, 129, 0.15)" : "rgba(11, 93, 82, 0.15)";
                      const roleBadgeColor = authorRole === "HOD" ? "#d97706" : authorRole === "FACULTY" ? "#059669" : "var(--royal-blue)";

                      return (
                        <div 
                          key={n.id} 
                          style={{ 
                            backgroundColor: "var(--bg-card)", 
                            padding: "1.35rem", 
                            borderRadius: "12px", 
                            border: "1px solid var(--border-subtle)", 
                            boxShadow: "var(--shadow-card)", 
                            display: "flex", 
                            flexDirection: "column", 
                            justifyContent: "space-between",
                            transition: "all 0.2s ease"
                          }}
                        >
                          <div>
                            {/* Card Header: Category, Audience, Department, Date */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem", gap: "0.5rem" }}>
                              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
                                <span style={{ 
                                  fontSize: "0.72rem", 
                                  padding: "0.2rem 0.55rem", 
                                  borderRadius: "6px", 
                                  fontWeight: "700", 
                                  letterSpacing: "0.03em",
                                  backgroundColor: n.category === "URGENT" ? "rgba(239,68,68,0.2)" : n.category === "EXAM" ? "rgba(245,158,11,0.2)" : "rgba(59,130,246,0.15)", 
                                  color: n.category === "URGENT" ? "#ef4444" : n.category === "EXAM" ? "#d97706" : "var(--royal-blue)" 
                                }}>
                                  {n.category}
                                </span>

                                {n.audience && (
                                  <span style={{ 
                                    fontSize: "0.72rem", 
                                    padding: "0.2rem 0.55rem", 
                                    borderRadius: "6px", 
                                    fontWeight: "600",
                                    backgroundColor: "var(--bg-card-header)", 
                                    color: "var(--text-muted)", 
                                    border: "1px solid var(--border-subtle)" 
                                  }}>
                                    👥 {n.audience}
                                  </span>
                                )}

                                {n.department && (
                                  <span style={{ 
                                    fontSize: "0.72rem", 
                                    padding: "0.2rem 0.55rem", 
                                    borderRadius: "6px", 
                                    fontWeight: "700",
                                    backgroundColor: "rgba(11, 93, 82, 0.12)", 
                                    color: "var(--sky-blue)", 
                                    border: "1px solid rgba(11, 93, 82, 0.25)" 
                                  }}>
                                    🏛️ {n.department}
                                  </span>
                                )}

                                {n.targetStudentId && (
                                  <span style={{ 
                                    fontSize: "0.72rem", 
                                    padding: "0.2rem 0.55rem", 
                                    borderRadius: "6px", 
                                    fontWeight: "600",
                                    backgroundColor: "rgba(122, 106, 158, 0.12)", 
                                    color: "#9333ea", 
                                    border: "1px solid rgba(122, 106, 158, 0.25)" 
                                  }}>
                                    🎯 {n.targetStudentId}
                                  </span>
                                )}
                              </div>

                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {new Date(n.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                              </span>
                            </div>

                            {/* Title & Body */}
                            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "0.5rem", color: "var(--text-main)", lineHeight: "1.4" }}>
                              {n.title}
                            </h3>

                            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: "1.55", margin: 0, whiteSpace: "pre-wrap" }}>
                              {n.content}
                            </p>
                          </div>

                          {/* Card Footer: Posted By author details + Delete Notice */}
                          <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                              <span style={{ 
                                padding: "0.2rem 0.5rem", 
                                borderRadius: "4px", 
                                fontSize: "0.7rem", 
                                fontWeight: "800", 
                                letterSpacing: "0.04em",
                                backgroundColor: roleBadgeBg, 
                                color: roleBadgeColor 
                              }}>
                                {authorRole}
                              </span>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--text-main)" }}>
                                  {authorName}
                                </span>
                                {authorEmail && (
                                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                    {authorEmail}
                                  </span>
                                )}
                              </div>
                            </div>

                            <button 
                              onClick={() => handleDeleteNotice(n.id)} 
                              style={{ 
                                backgroundColor: "rgba(239,68,68,0.12)", 
                                color: "#ef4444", 
                                border: "1px solid rgba(239,68,68,0.25)", 
                                padding: "0.35rem 0.75rem", 
                                borderRadius: "6px", 
                                fontSize: "0.78rem", 
                                fontWeight: "600", 
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                                transition: "all 0.15s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#ef4444";
                                e.currentTarget.style.color = "#ffffff";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.12)";
                                e.currentTarget.style.color = "#ef4444";
                              }}
                            >
                              <Trash2 size={13} /> Delete Notice
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TIMETABLE & STAFF ALLOCATIONS MERGED TAB */}
            {(activeTab === "timetable" || activeTab === "teacher-allocations") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Merged Navigation Sub-Tabs */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "14px",
                  border: "1.5px solid var(--border-subtle)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    <button
                      onClick={() => {
                        setTimetableSubTab("allocations");
                        setActiveTab("teacher-allocations");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.55rem",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "10px",
                        border: timetableSubTab === "allocations" ? "1px solid var(--royal-blue)" : "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        backgroundColor: timetableSubTab === "allocations" ? "var(--royal-blue)" : "var(--bg-input)",
                        color: timetableSubTab === "allocations" ? "#ffffff" : "var(--text-main)",
                        boxShadow: timetableSubTab === "allocations" ? "0 4px 12px rgba(11, 93, 82, 0.28)" : "none",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <UserCheck size={18} /> 👥 Teacher-Subject Allocation
                    </button>

                    <button
                      onClick={() => {
                        setTimetableSubTab("schedule");
                        setActiveTab("timetable");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.55rem",
                        padding: "0.65rem 1.25rem",
                        borderRadius: "10px",
                        border: timetableSubTab === "schedule" ? "1px solid var(--royal-blue)" : "1px solid var(--border-subtle)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: "700",
                        backgroundColor: timetableSubTab === "schedule" ? "var(--royal-blue)" : "var(--bg-input)",
                        color: timetableSubTab === "schedule" ? "#ffffff" : "var(--text-main)",
                        boxShadow: timetableSubTab === "schedule" ? "0 4px 12px rgba(11, 93, 82, 0.28)" : "none",
                        transition: "all 0.18s ease",
                      }}
                    >
                      <Calendar size={18} /> 📅 Timetable Schedule & Grid
                    </button>
                  </div>

                  <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "500" }}>
                    {timetableSubTab === "schedule"
                      ? "Viewing live weekly timetable grid by Class or Faculty"
                      : "Assigning courses, teachers, labs & room numbers per class section"}
                  </span>
                </div>

                {/* SubTab 2: Teacher Staff Allocation Deck */}
                {timetableSubTab === "allocations" && (
                  <TeacherSubjectAllocation
                    departments={depts}
                    initialTargetCourse={targetAllocationCourse}
                    onCourseUpdated={fetchData}
                    onBackToCatalog={() => {
                      setTargetAllocationCourse(null);
                      setActiveTab("subjects");
                    }}
                    onTimetableGenerated={(targetClassId) => {
                      fetchData();
                      const parts = targetClassId.split("-");
                      if (parts.length >= 3) {
                        setSelectedYear(parts[0]);
                        setSelectedDept(parts[1]);
                        setSelectedSection(parts[2]);
                      }
                      setTimetableSubTab("schedule");
                    }}
                  />
                )}

                {/* SubTab 1: Schedule View */}
                {timetableSubTab === "schedule" && (
                  <div>
                {/* Day Order Override Section */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", backgroundColor: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Set Today's Day Order</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                      Override the auto-calculated day order for today. This recalculates future day orders.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
                    <select 
                      value={currentDayOrderIndex} 
                      onChange={(e) => setCurrentDayOrderIndex(e.target.value)} 
                      className="premium-input"
                    >
                      <option value="0">Day Order I</option>
                      <option value="1">Day Order II</option>
                      <option value="2">Day Order III</option>
                      <option value="3">Day Order IV</option>
                      <option value="4">Day Order V</option>
                    </select>
                    <button 
                      onClick={handleUpdateDayOrder} 
                      className="btn-sky"
                      disabled={updatingDayOrder}
                    >
                      {updatingDayOrder ? "Updating..." : "Update Day Order"}
                    </button>
                  </div>
                </div>

                {/* Leave and Working Day Management Section */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem", backgroundColor: "var(--bg-card)", padding: "1.5rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Leave & Working Day Management</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0 0" }}>
                      Mark today or tomorrow as a leave to pause the day order, or as a working day to force it to advance.
                    </p>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.5rem" }}>
                    {/* Today */}
                    <div style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", backgroundColor: "var(--bg-input)" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>Today ({todayDateStr})</div>
                      <select 
                        value={todayStatus} 
                        onChange={(e) => handleUpdateLeave('today', e.target.value)} 
                        className="premium-input"
                        disabled={updatingLeave}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "6px" }}
                      >
                        <option value="REGULAR">Regular (Auto)</option>
                        <option value="LEAVE">Leave / Holiday</option>
                        <option value="WORKING_DAY">Working Day (Make-up)</option>
                      </select>
                    </div>
                    {/* Tomorrow */}
                    <div style={{ padding: "1rem", border: "1px solid var(--border-subtle)", borderRadius: "8px", backgroundColor: "var(--bg-input)" }}>
                      <div style={{ fontSize: "0.9rem", fontWeight: "600", marginBottom: "0.5rem" }}>Tomorrow ({tomorrowDateStr})</div>
                      <select 
                        value={tomorrowStatus} 
                        onChange={(e) => handleUpdateLeave('tomorrow', e.target.value)} 
                        className="premium-input"
                        disabled={updatingLeave}
                        style={{ width: "100%", padding: "0.5rem", borderRadius: "6px" }}
                      >
                        <option value="REGULAR">Regular (Auto)</option>
                        <option value="LEAVE">Leave / Holiday</option>
                        <option value="WORKING_DAY">Working Day (Make-up)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Timetable Schedule Management</h3>
                    <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>
                      View, verify, and modify weekly schedules by Faculty or by Student Class
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <div style={{ display: "flex", backgroundColor: "var(--bg-card-header)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                      <button
                        onClick={() => {
                          setTimetableMode("faculty");
                          setTimetable([]);
                          setIsEditingTimetable(false);
                        }}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: timetableMode === "faculty" ? "var(--sky-blue)" : "transparent",
                          color: timetableMode === "faculty" ? "#000" : "var(--text-muted)",
                          transition: "all 0.2s"
                        }}
                      >
                        👥 By Faculty
                      </button>
                      <button
                        onClick={() => {
                          setTimetableMode("class");
                          setTimetable([]);
                          setIsEditingTimetable(false);
                        }}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: timetableMode === "class" ? "var(--sky-blue)" : "transparent",
                          color: timetableMode === "class" ? "#000" : "var(--text-muted)",
                          transition: "all 0.2s"
                        }}
                      >
                        🏫 By Class
                      </button>
                      <button
                        onClick={() => {
                          setTimetableSubTab("allocations");
                        }}
                        style={{
                          padding: "0.4rem 0.85rem",
                          borderRadius: "6px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          border: "none",
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          color: "var(--sky-blue)",
                          transition: "all 0.2s"
                        }}
                        title="Open Teacher Staff Allocation Deck for this class"
                      >
                        ⚡ Staff Allocations →
                      </button>
                    </div>

                    {timetable.length > 0 && timetableMode === "class" && (
                      <button onClick={() => setTimetableCalendarView(!timetableCalendarView)} style={{ padding: "0.4rem 0.85rem", borderRadius: "8px", border: "1px solid var(--border-subtle)", backgroundColor: timetableCalendarView ? "var(--sky-blue)" : "transparent", color: timetableCalendarView ? "#fff" : "var(--text-muted)", cursor: "pointer" }}>
                         <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                           {timetableCalendarView ? <><LayoutGrid size={16} /> List View</> : <><Calendar size={16} /> Calendar View</>}
                         </span>
                      </button>
                    )}

                    {timetableMode === "class" && (
                      <button 
                        onClick={() => {
                          setHistoryFilterAcadYear("ALL");
                          setHistoryFilterSemType("ALL");
                          setHistoryFilterDept(selectedDept);
                          setHistoryFilterYear(selectedYear);
                          setHistoryFilterSection(selectedSection);
                          setShowHistoryModal(true);
                          fetchTimetableHistory({
                            acadYear: "ALL",
                            semType: "ALL",
                            dept: selectedDept,
                            year: selectedYear,
                            sec: selectedSection,
                          });
                        }}
                        style={{ 
                          padding: "0.4rem 0.85rem", 
                          borderRadius: "8px", 
                          border: "1px solid var(--border-subtle)", 
                          backgroundColor: "rgba(11, 93, 82, 0.12)", 
                          color: "var(--sky-blue)", 
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem"
                        }}
                      >
                        <History size={16} /> Timetable History
                      </button>
                    )}

                    {timetable.length > 0 && timetableMode === "class" && !timetableCalendarView && (
                      <button onClick={async () => {
                        if (isEditingTimetable) {
                          setLoadingTimetable(true);
                          const classId = `${selectedYear}-${selectedDept}-${selectedSection}`;
                          const semNumber = selectedYear === "I" ? 1 : selectedYear === "II" ? 3 : selectedYear === "III" ? 5 : 7;
                          const res = await fetch("/api/admin/timetable", {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ 
                              classId, 
                              entries: timetable,
                              academicYear: "2026-2027",
                              semester: semNumber,
                              changeReason: "Admin Manual Schedule Revision / Year-Sem Update"
                            })
                          }).then(r => r.json());
                          if(res.success) { 
                            alert(`Timetable updated! Previous timetable archived to history (${res.historyArchived || 0} periods preserved in history).`); 
                            setIsEditingTimetable(false); 
                          }
                          else { alert("Failed to update: " + res.error); }
                          setLoadingTimetable(false);
                        } else {
                          setIsEditingTimetable(true);
                        }
                      }} className={isEditingTimetable ? "btn-royal" : "btn-sky"}>
                        <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {isEditingTimetable ? <><Save size={16} /> Save Changes (Archives to History)</> : <><Edit size={16} /> Edit Timetable</>}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", backgroundColor: "var(--bg-card)", padding: "1rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", flexWrap: "wrap", alignItems: "center" }}>
                  {timetableMode === "faculty" ? (
                    <>
                      <div style={{ flex: 2, minWidth: "240px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Select Faculty Member</label>
                        <select
                          value={selectedFaculty}
                          onChange={(e) => setSelectedFaculty(e.target.value)}
                          className="premium-input"
                          style={{ width: "100%" }}
                        >
                          {availableFaculty.length > 0 ? (
                            availableFaculty.map((f) => (
                              <option key={f.name} value={f.name}>
                                {f.name} {f.vmsNo ? `(MTS/VMS: ${f.vmsNo})` : ""}
                              </option>
                            ))
                          ) : (
                            <option value="">No faculty loaded</option>
                          )}
                        </select>
                      </div>

                      <button
                        onClick={async () => {
                          if (!selectedFaculty) return;
                          setLoadingTimetable(true);
                          setIsEditingTimetable(false);
                          try {
                            const res = await fetch(`/api/admin/timetable?facultyName=${encodeURIComponent(selectedFaculty)}`).then(r => r.json());
                            if (res.success) {
                              setTimetable(res.timetable);
                            } else {
                              alert("Error: " + res.error);
                            }
                          } catch (e: any) {
                            alert("Fetch failed: " + e.message);
                          } finally {
                            setLoadingTimetable(false);
                          }
                        }}
                        className="btn-royal"
                        style={{ minWidth: "150px", alignSelf: "flex-end", height: "42px" }}
                      >
                        Fetch Schedule
                      </button>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Department</label>
                        <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                          <option value="CSE">CSE</option>
                          <option value="IT">IT</option>
                          <option value="ECE">ECE</option>
                          <option value="MECH">MECH</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: "140px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Year</label>
                        <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                          <option value="I">Year I</option>
                          <option value="II">Year II</option>
                          <option value="III">Year III</option>
                          <option value="IV">Year IV</option>
                        </select>
                      </div>

                      <div style={{ flex: 1, minWidth: "120px" }}>
                        <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>Section</label>
                        <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                        </select>
                      </div>

                      <button onClick={async () => {
                        setLoadingTimetable(true);
                        setIsEditingTimetable(false);
                        const classId = `${selectedYear}-${selectedDept}-${selectedSection}`;
                        const res = await fetch(`/api/admin/timetable?classId=${encodeURIComponent(classId)}`).then(r => r.json());
                        if (res.success) {
                          setTimetable(res.timetable);
                        } else {
                          alert("Error: " + res.error);
                        }
                        setLoadingTimetable(false);
                      }} className="btn-royal" style={{ minWidth: "140px", alignSelf: "flex-end", height: "42px" }}>
                        Fetch Timetable
                      </button>

                      <button
                        onClick={async () => {
                          const classId = `${selectedYear}-${selectedDept}-${selectedSection}`;
                          if (!confirm(`Fill missing periods for class ${classId} with randomized subjects from this class's curriculum? Existing scheduled periods will remain untouched.`)) return;
                          setRandomizingTimetable(true);
                          setIsEditingTimetable(false);
                          try {
                            const res = await fetch("/api/admin/timetable/randomize", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ classId })
                            }).then(r => r.json());
                            if (res.success) {
                              setTimetable(res.timetable);
                              alert(res.message || `Missing periods filled successfully for ${classId}!`);
                            } else {
                              alert("Randomize failed: " + res.error);
                            }
                          } catch (e: any) {
                            alert("Randomize error: " + e.message);
                          } finally {
                            setRandomizingTimetable(false);
                          }
                        }}
                        disabled={randomizingTimetable}
                        title="Randomly fills empty periods in this class timetable while leaving existing periods unchanged"
                        style={{
                          minWidth: "175px",
                          alignSelf: "flex-end",
                          height: "42px",
                          backgroundColor: "rgba(122, 106, 158, 0.15)",
                          color: "#7a6a9e",
                          border: "1px solid rgba(122, 106, 158, 0.35)",
                          padding: "0.6rem 1rem",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "0.85rem",
                          cursor: randomizingTimetable ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.4rem",
                          opacity: randomizingTimetable ? 0.7 : 1
                        }}
                      >
                        <Shuffle size={16} /> {randomizingTimetable ? "Filling Missing..." : "Randomize Missing Periods"}
                      </button>

                      <button onClick={async () => {
                        const classId = `${selectedYear}-${selectedDept}-${selectedSection}`;
                        if (!confirm(`Are you sure you want to permanently delete the entire timetable for class ${classId}?`)) return;
                        setLoadingTimetable(true);
                        try {
                          const res = await fetch(`/api/admin/timetable?classId=${encodeURIComponent(classId)}`, { method: "DELETE" }).then(r => r.json());
                          if (res.success) {
                            setTimetable([]);
                            alert(`Successfully deleted timetable for ${classId} (${res.count} periods removed)`);
                          } else {
                            alert("Error deleting timetable: " + res.error);
                          }
                        } catch (e: any) {
                          alert("Failed to delete: " + e.message);
                        } finally {
                          setLoadingTimetable(false);
                        }
                      }} style={{
                        minWidth: "140px",
                        alignSelf: "flex-end",
                        height: "42px",
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        color: "#ef4444",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        padding: "0.6rem 1rem",
                        borderRadius: "8px",
                        fontWeight: "600",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem"
                      }}>
                        <Trash2 size={16} /> Delete Timetable
                      </button>
                    </>
                  )}
                </div>

                {loadingTimetable ? (
                  <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>Loading timetable...</div>
                ) : timetable.length > 0 ? (
                  <div className="responsive-table-wrapper">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem", minWidth: "900px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-muted)" }}>
                          <th style={{ padding: "0.85rem", width: "80px" }}>Day</th>
                          {[1,2,3,4,5,6,7,8].map(p => <th key={p} style={{ padding: "0.85rem", minWidth: "120px" }}>Period {p}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {["I", "II", "III", "IV", "V"].map(day => (
                          <tr key={day} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "0.85rem", fontWeight: "700", borderRight: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)" }}>Day {day}</td>
                            {[1,2,3,4,5,6,7,8].map(period => {
                              const matchingEntries = timetable.filter(t => t.dayOrder === day && t.period === period);
                              const primaryEntry = matchingEntries[0] || null;
                              return (
                                <td key={period} style={{ padding: "0.5rem", borderRight: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                                  {isEditingTimetable ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                                      <input type="text" placeholder="Subject Name" value={primaryEntry?.subjectName || ""} onChange={(e) => {
                                        const newTt = [...timetable];
                                        const entryIdx = newTt.findIndex(t => t.dayOrder === day && t.period === period);
                                        if (entryIdx !== -1) newTt[entryIdx].subjectName = e.target.value;
                                        else newTt.push({ dayOrder: day, period, subjectName: e.target.value, subjectCode: "", facultyName: "", roomNo: "", timeRange: `Period ${period}` });
                                        setTimetable(newTt);
                                      }} style={{ width: "100%", padding: "0.25rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-main)" }} />
                                      <input type="text" placeholder="Faculty (separate up to 3 with commas for labs)" title="Up to 3 staff can be assigned, separated by commas" value={primaryEntry?.facultyName || ""} onChange={(e) => {
                                        const newTt = [...timetable];
                                        const entryIdx = newTt.findIndex(t => t.dayOrder === day && t.period === period);
                                        if (entryIdx !== -1) newTt[entryIdx].facultyName = e.target.value;
                                        setTimetable(newTt);
                                      }} style={{ width: "100%", padding: "0.25rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-main)" }} />
                                      <input type="text" placeholder="Faculty MTS No (e.g. 1947, 2017, 2002)" value={primaryEntry?.vmsNo || ""} onChange={(e) => {
                                        const newTt = [...timetable];
                                        const entryIdx = newTt.findIndex(t => t.dayOrder === day && t.period === period);
                                        if (entryIdx !== -1) newTt[entryIdx].vmsNo = e.target.value;
                                        setTimetable(newTt);
                                      }} style={{ width: "100%", padding: "0.25rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-main)" }} />
                                      <input type="text" placeholder="Room No" value={primaryEntry?.roomNo || ""} onChange={(e) => {
                                        const newTt = [...timetable];
                                        const entryIdx = newTt.findIndex(t => t.dayOrder === day && t.period === period);
                                        if (entryIdx !== -1) newTt[entryIdx].roomNo = e.target.value;
                                        setTimetable(newTt);
                                      }} style={{ width: "100%", padding: "0.25rem", fontSize: "0.8rem", borderRadius: "4px", border: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-input)", color: "var(--text-main)" }} />
                                    </div>
                                  ) : matchingEntries.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                      {matchingEntries.map((entry, eIdx) => (
                                        <div key={eIdx} style={{
                                          display: "flex",
                                          flexDirection: "column",
                                          gap: "0.15rem",
                                          padding: matchingEntries.length > 1 ? "0.3rem 0.4rem" : "0",
                                          backgroundColor: matchingEntries.length > 1 ? "rgba(11, 93, 82, 0.06)" : "transparent",
                                          borderRadius: "6px",
                                          borderLeft: matchingEntries.length > 1 ? "2px solid var(--sky-blue)" : "none"
                                        }}>
                                          <strong style={{ color: "var(--sky-blue)", lineHeight: "1.2", fontSize: "0.85rem" }}>
                                            {entry.subjectName || "-"}
                                          </strong>
                                          {entry.facultyName && entry.facultyName.includes(",") ? (
                                            <div style={{ marginTop: "2px" }}>
                                              <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "var(--sky-blue)", backgroundColor: "rgba(11, 93, 82, 0.12)", padding: "1px 4px", borderRadius: "3px" }}>
                                                Lab Staff ({entry.facultyName.split(",").length}):
                                              </span>
                                              <div style={{ fontSize: "0.72rem", color: "var(--text-main)", fontWeight: 600, marginTop: "1px" }}>
                                                {entry.facultyName.split(",").map(f => f.trim()).join(" • ")}
                                              </div>
                                              {timetableMode === "faculty" && (
                                                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                                                  Class: {entry.classId || "-"}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                                              {timetableMode === "faculty" ? `Class: ${entry.classId || "-"}` : `Faculty: ${entry.facultyName || "-"}`}
                                            </span>
                                          )}
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "1px", flexWrap: "wrap" }}>
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", backgroundColor: "rgba(255,255,255,0.05)", padding: "0.1rem 0.3rem", borderRadius: "4px" }}>
                                              {entry.roomNo || "LH-101"}
                                            </span>
                                            {entry.semType && (
                                              <span style={{
                                                fontSize: "0.62rem",
                                                fontWeight: 700,
                                                padding: "0.08rem 0.35rem",
                                                borderRadius: "4px",
                                                backgroundColor: entry.semType.toUpperCase() === "ODD" ? "rgba(122, 106, 158, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                                color: entry.semType.toUpperCase() === "ODD" ? "#7a6a9e" : "#10b981",
                                                border: entry.semType.toUpperCase() === "ODD" ? "1px solid rgba(122, 106, 158, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                              }}>
                                                Sem ({entry.semType.toUpperCase() === "ODD" ? "Odd" : "Even"})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div style={{ color: "var(--text-muted)", opacity: 0.4, fontSize: "0.85rem", textAlign: "center", padding: "0.5rem 0" }}>-</div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{
                    padding: "3.5rem 2rem",
                    textAlign: "center",
                    backgroundColor: "var(--bg-card)",
                    borderRadius: "14px",
                    border: "1.5px dashed var(--border-subtle)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "1rem"
                  }}>
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      backgroundColor: "rgba(11, 93, 82, 0.12)",
                      color: "var(--royal-blue)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Calendar size={28} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 0.35rem 0", fontSize: "1.05rem", fontWeight: "700" }}>
                        No Schedule Loaded for Selected View
                      </h4>
                      <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem", maxWidth: "480px" }}>
                        Select your Department, Year & Section and click <strong>Fetch Timetable</strong>, or configure teacher allocations to generate a fresh weekly timetable.
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
                      <button
                        onClick={() => {
                          setTimetableSubTab("allocations");
                          setActiveTab("teacher-allocations");
                        }}
                        className="btn-royal"
                        style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 1.25rem" }}
                      >
                        <UserCheck size={16} /> Open Teacher-Subject Allocation
                      </button>
                    </div>
                  </div>
                )}
                  </div>
                )}
              </div>
            )}

            {/* AUTOMATION ENGINE & AUDIT TRAIL MERGED TAB */}
            {(activeTab === "automation" || activeTab === "audit") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Subtab Navigator */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.4rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  width: "fit-content"
                }}>
                  <button
                    onClick={() => { setActiveTab("automation"); setAutomationSubTab("engine"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      backgroundColor: automationSubTab === "engine" ? "var(--royal-blue)" : "transparent",
                      color: automationSubTab === "engine" ? "#ffffff" : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Zap size={16} /> Automation & Intelligence Engine
                  </button>

                  <button
                    onClick={() => { setActiveTab("automation"); setAutomationSubTab("audit"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      backgroundColor: automationSubTab === "audit" ? "var(--royal-blue)" : "transparent",
                      color: automationSubTab === "audit" ? "#ffffff" : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <Shield size={16} /> System Audit Trail ({auditLogs.length})
                  </button>
                </div>

                {/* Subtab 1: Automation Engine */}
                {automationSubTab === "engine" && (
                  <AdminAutomationHub />
                )}

                {/* Subtab 2: Audit Logs */}
                {automationSubTab === "audit" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
                      <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>System Audit Trail</h3>
                        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: 0 }}>Real-time logs of administrative actions, user modifications, and security events</p>
                      </div>
                      <button onClick={() => fetchData()} className="btn-sky" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
                        🔄 Refresh Logs
                      </button>
                    </div>

                {auditLogs.length > 0 ? (
                  <div className="responsive-table-wrapper">
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.9rem", minWidth: "700px" }}>
                      <thead>
                        <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                          <th style={{ padding: "0.75rem 1rem" }}>Timestamp</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Action</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Details & Scope</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Target User</th>
                          <th style={{ padding: "0.75rem 1rem" }}>Actor</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log) => {
                          const isCreate = log.action.includes("CREATE");
                          const isDelete = log.action.includes("DELETE");
                          const badgeBg = isCreate ? "rgba(16, 185, 129, 0.15)" : isDelete ? "rgba(239, 68, 68, 0.15)" : "rgba(11, 93, 82, 0.15)";
                          const badgeColor = isCreate ? "#10b981" : isDelete ? "#ef4444" : "var(--sky-blue)";

                          return (
                            <tr
                              key={log.id}
                              style={{ borderBottom: "1px solid var(--border-subtle)", transition: "background-color 0.2s ease" }}
                            >
                              <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                                {new Date(log.createdAt).toLocaleString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit"
                                })}
                              </td>
                              <td style={{ padding: "0.85rem 1rem" }}>
                                <span style={{
                                  display: "inline-block",
                                  padding: "0.2rem 0.6rem",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: "700",
                                  backgroundColor: badgeBg,
                                  color: badgeColor,
                                  letterSpacing: "0.03em"
                                }}>
                                  {log.action}
                                </span>
                              </td>
                              <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", color: "var(--text-main)" }}>
                                {log.details}
                              </td>
                              <td style={{ padding: "0.85rem 1rem", fontSize: "0.8rem" }}>
                                {log.user ? (
                                  <div>
                                    <strong style={{ color: "var(--sky-blue)", display: "block" }}>{log.user.name}</strong>
                                    <span style={{ color: "var(--text-muted)" }}>{log.user.email}</span>
                                  </div>
                                ) : (
                                  <span style={{ color: "var(--text-muted)" }}>-</span>
                                )}
                              </td>
                              <td style={{ padding: "0.85rem 1rem", fontSize: "0.85rem", fontWeight: "600", color: "var(--text-muted)" }}>
                                {log.performedBy}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)", backgroundColor: "var(--bg-card)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                    No audit records logged yet. System operations will automatically appear here.
                  </div>
                )}
                  </div>
                )}
              </div>
            )}

            {/* MERGED TIMETABLE IMPORT & BULK USER ONBOARDING DECK */}
            {(activeTab === "upload-timetable" || activeTab === "upload-users") && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                {/* Deck Mode Navigator */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.4rem",
                  backgroundColor: "var(--bg-card)",
                  borderRadius: "10px",
                  border: "1px solid var(--border-subtle)",
                  width: "fit-content"
                }}>
                  <button
                    onClick={() => { setActiveTab("upload-timetable"); setImportSubTab("timetable"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      backgroundColor: (importSubTab === "timetable" && activeTab !== "upload-users") ? "var(--royal-blue)" : "transparent",
                      color: (importSubTab === "timetable" && activeTab !== "upload-users") ? "#ffffff" : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <FileText size={16} /> Timetable Import & Official Templates
                  </button>

                  <button
                    onClick={() => { setActiveTab("upload-timetable"); setImportSubTab("users"); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 1rem",
                      borderRadius: "7px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      backgroundColor: (importSubTab === "users" || activeTab === "upload-users") ? "var(--royal-blue)" : "transparent",
                      color: (importSubTab === "users" || activeTab === "upload-users") ? "#ffffff" : "var(--text-muted)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <UserPlus size={16} /> Bulk User Onboarding (Excel)
                  </button>
                </div>

                {/* Subtab 1: Timetable Upload */}
                {(importSubTab === "timetable" && activeTab !== "upload-users") && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Upload Format Toggle Header */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: "var(--bg-card)",
                      padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border-subtle)",
                      flexWrap: "wrap",
                      gap: "0.75rem"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--text-main)" }}>
                          Upload Mode:
                        </span>
                        <div style={{ display: "flex", backgroundColor: "var(--bg-input)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                          <button
                            onClick={() => setTimetableUploadTab("excel")}
                            style={{
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: timetableUploadTab === "excel" ? "var(--royal-blue)" : "transparent",
                              color: timetableUploadTab === "excel" ? "#fff" : "var(--text-muted)",
                              transition: "all 0.2s"
                            }}
                          >
                            📊 1. Excel (.xlsx / .csv)
                          </button>
                          <button
                            onClick={() => setTimetableUploadTab("pdf-doc")}
                            style={{
                              padding: "0.4rem 0.9rem",
                              borderRadius: "6px",
                              fontSize: "0.85rem",
                              fontWeight: "700",
                              border: "none",
                              cursor: "pointer",
                              backgroundColor: timetableUploadTab === "pdf-doc" ? "var(--royal-blue)" : "transparent",
                              color: timetableUploadTab === "pdf-doc" ? "#fff" : "var(--text-muted)",
                              transition: "all 0.2s"
                            }}
                          >
                            📑 2. PDF or Word (.pdf / .docx)
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        <a
                          href="/api/admin/timetable/template-doc"
                          download="timetable-import-template.docx"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            textDecoration: "none",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          ⬇ Word Template (.docx)
                        </a>
                        <a
                          href="/api/admin/timetable/template-pdf?type=individual"
                          download="individual-faculty-timetable-template.pdf"
                          style={{
                            fontSize: "0.8rem",
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "var(--bg-input)",
                            border: "1px solid var(--border-subtle)",
                            color: "var(--text-main)",
                            textDecoration: "none",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem"
                          }}
                        >
                          ⬇ PDF Template (.pdf)
                        </a>
                      </div>
                    </div>

                    {timetableUploadTab === "excel" ? (
                      <AdminTimetableExcelUpload
                        onUploadSuccess={() => {
                          fetch("/api/admin/audit-logs").then((r) => r.json()).then((res) => {
                            if (res.success) setAuditLogs(res.logs);
                          });
                          fetchData();
                        }}
                      />
                    ) : (
                      <AdminTimetablePdfUpload
                        onUploadSuccess={() => {
                          fetch("/api/admin/audit-logs").then((r) => r.json()).then((res) => {
                            if (res.success) setAuditLogs(res.logs);
                          });
                          fetchData();
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Subtab 2: Bulk User Onboarding */}
                {(importSubTab === "users" || activeTab === "upload-users") && (
                  <AdminUserExcelUpload
                    onUploadSuccess={() => {
                      fetch("/api/admin/users").then((r) => r.json()).then((res) => {
                        if (res.success) setUsers(res.users);
                      });
                      fetch("/api/admin/audit-logs").then((r) => r.json()).then((res) => {
                        if (res.success) setAuditLogs(res.logs);
                      });
                    }}
                  />
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* USER PROFILE SIDE DRAWER / SLIDE-OVER SIDEBAR */}
      {selectedUser && (
        <div className="admin-drawer-container" onClick={() => setSelectedUser(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="admin-drawer"
          >
            <div>
              {/* Drawer Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "1rem", borderBottom: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--sky-blue)", letterSpacing: "0.05em" }}>
                  ACCOUNT PROFILE DETAILS
                </span>
                <button onClick={() => setSelectedUser(null)} style={{ backgroundColor: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}>
                  ✕
                </button>
              </div>

              {/* User Avatar & Name */}
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "16px",
                  background: selectedUser.role === "ADMIN"
                    ? "linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)"
                    : selectedUser.role === "HOD"
                    ? "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
                    : selectedUser.role === "FACULTY"
                    ? "linear-gradient(135deg, #10b981 0%, #047857 100%)"
                    : "linear-gradient(135deg, var(--royal-blue) 0%, var(--sky-blue) 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontSize: "1.5rem",
                  fontWeight: "700"
                }}>
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0 }}>{selectedUser.name}</h3>
                  <span style={{
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    backgroundColor: selectedUser.role === "ADMIN" ? "rgba(239,68,68,0.15)" : selectedUser.role === "HOD" ? "rgba(245,158,11,0.15)" : selectedUser.role === "FACULTY" ? "rgba(16,185,129,0.15)" : "rgba(11,93,82,0.15)",
                    color: selectedUser.role === "ADMIN" ? "#ef4444" : selectedUser.role === "HOD" ? "#d97706" : selectedUser.role === "FACULTY" ? "#059669" : "var(--royal-blue)"
                  }}>
                    {selectedUser.role === "FACULTY" ? "TEACHER / FACULTY" : selectedUser.role}
                  </span>
                </div>
              </div>

              {/* Dynamic Usermode Role Profile Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem", backgroundColor: "var(--bg-page)", padding: "1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)", marginBottom: "1.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>VM NO (Institutional Number)</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--sky-blue)" }}>{selectedUser.vmNo || "N/A"}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Email Address</span>
                  <strong style={{ fontSize: "0.95rem", color: "var(--sky-blue)" }}>{selectedUser.email}</strong>
                </div>

                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Account Status</span>
                  <strong style={{ fontSize: "0.95rem", color: "#10b981" }}>● {selectedUser.status}</strong>
                </div>

                {/* Role Specific Details fetched from Database */}
                {selectedUser.role === "STUDENT" && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Roll Number / Register ID</span>
                      <strong style={{ fontSize: "0.95rem" }}>{selectedUser.studentProfile?.rollNumber || "Not Set in DB"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Department & Batch</span>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {selectedUser.studentProfile ? `${selectedUser.studentProfile.department} • Semester ${selectedUser.studentProfile.semester} (${selectedUser.studentProfile.batch})` : "Not Set in DB"}
                      </strong>
                    </div>
                  </>
                )}

                {selectedUser.role === "FACULTY" && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Faculty Staff VM NO</span>
                      <strong style={{ fontSize: "0.95rem" }}>{selectedUser.facultyProfile?.vmNo || selectedUser.vmNo || "Not Set in DB"}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Designation & Dept</span>
                      <strong style={{ fontSize: "0.95rem" }}>
                        {selectedUser.facultyProfile ? `${selectedUser.facultyProfile.designation} • ${selectedUser.facultyProfile.department}` : "Not Set in DB"}
                      </strong>
                    </div>

                    {(() => {
                      const fp = selectedUser.facultyProfile;
                      if (!fp) return null;

                      // Helper to find classes for this teacher's subject from the subjects state
                      const getClassesForSub = (subName: string | null | undefined): string[] => {
                        if (!subName || !subName.trim()) return [];
                        const sLower = subName.trim().toLowerCase();
                        const foundSubject = subjects.find(
                          (s) =>
                            s.name.toLowerCase() === sLower ||
                            s.code.toLowerCase() === sLower ||
                            s.name.toLowerCase().includes(sLower) ||
                            sLower.includes(s.name.toLowerCase())
                        );
                        if (!foundSubject || !foundSubject.scheduleSlots) return foundSubject?.classesTaking || [];

                        // Filter schedule slots specifically handled by this teacher
                        const teacherNameLower = (selectedUser.name || "").toLowerCase().trim();
                        const vmNoStr = (selectedUser.vmNo || fp.vmNo || "").trim();
                        
                        const matchingSlots = foundSubject.scheduleSlots.filter((slot: any) => {
                          const fn = (slot.facultyName || "").toLowerCase();
                          const staffList = fn.split(/[,/]+/).map((s: string) => s.trim());
                          const isNameMatch = staffList.some((s: string) => s === teacherNameLower || s.includes(teacherNameLower) || teacherNameLower.includes(s));
                          const isVmMatch = vmNoStr && fn.includes(vmNoStr);
                          return isNameMatch || isVmMatch;
                        });

                        if (matchingSlots.length > 0) {
                          return Array.from(new Set(matchingSlots.map((s: any) => s.classId).filter(Boolean)));
                        }
                        return [];
                      };

                      const coreSubjects = [
                        { tag: "Sub 1", val: fp.subject1, color: "var(--royal-blue)", bg: "rgba(11, 93, 82, 0.15)" },
                        { tag: "Sub 2", val: fp.subject2, color: "var(--royal-blue)", bg: "rgba(11, 93, 82, 0.15)" },
                        { tag: "Lab 1", val: fp.lab1, color: "#d97706", bg: "rgba(245, 158, 11, 0.15)" },
                        { tag: "Lab 2", val: fp.lab2, color: "#d97706", bg: "rgba(245, 158, 11, 0.15)" },
                      ].filter((s) => Boolean(s.val));

                      const additionalSubjects = [
                        { tag: "Add 1", val: fp.additional1, color: "#7a6a9e", bg: "rgba(122, 106, 158, 0.15)" },
                        { tag: "Add 2", val: fp.additional2, color: "#7a6a9e", bg: "rgba(122, 106, 158, 0.15)" },
                      ].filter((s) => Boolean(s.val));

                      return (
                        <>
                          {coreSubjects.length > 0 && (
                            <div>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.45rem", fontWeight: "700" }}>
                                Assigned Core Teaching Subjects & Classes
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                {coreSubjects.map((s, idx) => {
                                  const classes = getClassesForSub(s.val);
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: "0.6rem 0.75rem",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-card-header)",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                                        <span style={{ padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.7rem", backgroundColor: s.bg, color: s.color, fontWeight: "700" }}>
                                          {s.tag}
                                        </span>
                                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", flex: 1 }}>
                                          {s.val}
                                        </span>
                                      </div>
                                      <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Classes:</span>
                                        {classes.length > 0 ? (
                                          classes.map((cls) => (
                                            <span
                                              key={cls}
                                              style={{
                                                fontSize: "0.72rem",
                                                fontWeight: "700",
                                                padding: "0.1rem 0.4rem",
                                                borderRadius: "4px",
                                                backgroundColor: "rgba(11, 93, 82, 0.15)",
                                                color: "var(--sky-blue)",
                                                border: "1px solid rgba(11, 93, 82, 0.3)",
                                              }}
                                            >
                                              {cls}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                            No classes assigned yet
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {additionalSubjects.length > 0 && (
                            <div style={{ marginTop: "0.5rem" }}>
                              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "0.45rem", fontWeight: "700" }}>
                                Additional Assignments & Classes
                              </span>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                                {additionalSubjects.map((s, idx) => {
                                  const classes = getClassesForSub(s.val);
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        padding: "0.6rem 0.75rem",
                                        borderRadius: "8px",
                                        backgroundColor: "var(--bg-card-header)",
                                        border: "1px solid var(--border-subtle)",
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
                                        <span style={{ padding: "0.15rem 0.45rem", borderRadius: "4px", fontSize: "0.7rem", backgroundColor: s.bg, color: s.color, fontWeight: "700" }}>
                                          {s.tag}
                                        </span>
                                        <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)", flex: 1 }}>
                                          {s.val}
                                        </span>
                                      </div>
                                      <div style={{ marginTop: "0.4rem", display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Assigned Classes:</span>
                                        {classes.length > 0 ? (
                                          classes.map((cls) => (
                                            <span
                                              key={cls}
                                              style={{
                                                fontSize: "0.72rem",
                                                fontWeight: "700",
                                                padding: "0.1rem 0.4rem",
                                                borderRadius: "4px",
                                                backgroundColor: "rgba(122, 106, 158, 0.15)",
                                                color: "#7a6a9e",
                                                border: "1px solid rgba(122, 106, 158, 0.3)",
                                              }}
                                            >
                                              {cls}
                                            </span>
                                          ))
                                        ) : (
                                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic" }}>
                                            No classes assigned yet
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}

                {selectedUser.role === "HOD" && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Executive Office</span>
                      <strong style={{ fontSize: "0.95rem" }}>Head of Department (CSE)</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Department Jurisdiction</span>
                      <strong style={{ fontSize: "0.95rem" }}>Computer Science and Engineering Division</strong>
                    </div>
                  </>
                )}

                {selectedUser.role === "ADMIN" && (
                  <>
                    <div>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Permission Level</span>
                      <strong style={{ fontSize: "0.95rem", color: "#ef4444" }}>Super Administrator (Full System Controls)</strong>
                    </div>
                  </>
                )}

                <div>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>Account Created</span>
                  <strong style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "1rem", borderTop: "1px solid var(--border-subtle)" }}>
              <button
                onClick={() => openUserTimetable(selectedUser)}
                style={{
                  backgroundColor: "rgba(11, 93, 82, 0.15)",
                  color: "var(--sky-blue)",
                  border: "1px solid rgba(11, 93, 82, 0.3)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--royal-blue)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(11, 93, 82, 0.15)";
                  e.currentTarget.style.color = "var(--sky-blue)";
                }}
              >
                <Calendar size={16} /> View {selectedUser.name}&apos;s Timetable
              </button>

              <button
                onClick={() => alert(`Password reset link generated for ${selectedUser.email}`)}
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  border: "1px solid var(--border-subtle)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                Reset User Password
              </button>

              <button
                onClick={() => handleDeleteUser(selectedUser.id)}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.15)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  padding: "0.75rem",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "0.85rem"
                }}
              >
                Delete Account
              </button>
            </div>
          </aside>
        </div>
      )}



      {/* MODALS */}
      {showUserModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Create New User Account</h3>
            <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="Full Name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required className="premium-input" />
              <input type="email" placeholder="Email Address" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} required className="premium-input" />
              <input type="password" placeholder="Password" value={newUserPass} onChange={(e) => setNewUserPass(e.target.value)} required className="premium-input" />
              <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} className="premium-input">
                <option value="STUDENT">STUDENT</option><option value="FACULTY">TEACHER / FACULTY</option><option value="HOD">HOD</option><option value="ADMIN">ADMIN</option>
              </select>
              {newUserRole !== "ADMIN" && (
                <input 
                  type="text" 
                  placeholder={newUserRole === "STUDENT" ? "VM No (e.g. 17433)" : "MTS No (e.g. 1944 or MTS-CSE-001)"} 
                  value={newUserVmNo} 
                  onChange={(e) => setNewUserVmNo(e.target.value)} 
                  required 
                  className="premium-input" 
                />
              )}
              {newUserRole === "STUDENT" && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <select value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)} className="premium-input" style={{ flex: 1 }}>
                    {depts.length > 0 ? (
                      depts.map((d) => (
                        <option key={d.code} value={d.code}>{d.code}</option>
                      ))
                    ) : (
                      <option value="CSE">CSE</option>
                    )}
                  </select>
                  <select value={newUserYear} onChange={(e) => setNewUserYear(e.target.value)} className="premium-input" style={{ flex: 1 }}>
                    <option value="I">Year I</option>
                    <option value="II">Year II</option>
                    <option value="III">Year III</option>
                    <option value="IV">Year IV</option>
                  </select>
                  <select value={newUserSection} onChange={(e) => setNewUserSection(e.target.value)} className="premium-input" style={{ flex: 1 }}>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              )}

              {(newUserRole === "FACULTY" || newUserRole === "HOD") && (
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <select value={newUserDept} onChange={(e) => setNewUserDept(e.target.value)} className="premium-input" style={{ flex: 1 }}>
                    {depts.length > 0 ? (
                      depts.map((d) => (
                        <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                      ))
                    ) : (
                      <option value="CSE">CSE</option>
                    )}
                  </select>
                  <input
                    type="text"
                    placeholder={newUserRole === "HOD" ? "Designation (e.g. Head of Department)" : "Designation (e.g. Assistant Professor)"}
                    value={newUserDesignation}
                    onChange={(e) => setNewUserDesignation(e.target.value)}
                    className="premium-input"
                    style={{ flex: 1 }}
                  />
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button type="submit" className="btn-royal" style={{ flex: 1 }}>Create User</button>
                <button type="button" onClick={() => setShowUserModal(false)} style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--text-main)", padding: "0.75rem 1rem", borderRadius: "8px", border: "none" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeptModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "520px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>Create New Department</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Link an HOD using their MTS / VM Number to automatically sync their details from their user profile.
            </p>
            <form onSubmit={handleCreateDept} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem", display: "block" }}>
                  Department Code *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. AI-DS, ECE, MECH" 
                  value={newDeptCode} 
                  onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())} 
                  required 
                  className="premium-input" 
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem", display: "block" }}>
                  Full Department Name *
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Artificial Intelligence and Data Science" 
                  value={newDeptName} 
                  onChange={(e) => setNewDeptName(e.target.value)} 
                  required 
                  className="premium-input" 
                />
              </div>

              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
                <label style={{ fontSize: "0.75rem", color: "var(--sky-blue)", fontWeight: "700", marginBottom: "0.3rem", display: "block" }}>
                  HOD MTS / VM Number (Account Link)
                </label>
                
                {/* Select from existing Faculty / HOD users or type custom MTS No */}
                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                  <select 
                    value={newDeptHodVmNo} 
                    onChange={(e) => {
                      const selectedVal = e.target.value;
                      setNewDeptHodVmNo(selectedVal);
                      const matched = users.find((u) => u.vmNo && u.vmNo.trim().toLowerCase() === selectedVal.trim().toLowerCase());
                      if (matched) {
                        setNewDeptHod(matched.name);
                      }
                    }} 
                    className="premium-input" 
                    style={{ flex: 1.2 }}
                  >
                    <option value="">-- Choose User by MTS / VM No --</option>
                    {users
                      .filter((u) => u.vmNo && (u.role === "HOD" || u.role === "FACULTY"))
                      .map((u) => (
                        <option key={u.id} value={u.vmNo!}>
                          {u.vmNo} - {u.name} ({u.role})
                        </option>
                      ))}
                  </select>
                  
                  <input 
                    type="text" 
                    placeholder="Or type MTS No" 
                    value={newDeptHodVmNo} 
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewDeptHodVmNo(val);
                      const matched = users.find((u) => u.vmNo && u.vmNo.trim().toLowerCase() === val.trim().toLowerCase());
                      if (matched) {
                        setNewDeptHod(matched.name);
                      }
                    }} 
                    className="premium-input" 
                    style={{ flex: 0.8 }} 
                  />
                </div>

                {/* Auto-synced HOD Profile Card Preview */}
                {(() => {
                  const matchedUser = users.find((u) => u.vmNo && u.vmNo.trim().toLowerCase() === newDeptHodVmNo.trim().toLowerCase());
                  if (matchedUser) {
                    return (
                      <div style={{ 
                        backgroundColor: "rgba(11, 93, 82, 0.08)", 
                        border: "1px solid rgba(11, 93, 82, 0.25)", 
                        borderRadius: "8px", 
                        padding: "0.75rem", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "0.75rem",
                        marginTop: "0.5rem"
                      }}>
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "var(--royal-blue)",
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          fontSize: "0.9rem"
                        }}>
                          {matchedUser.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <strong style={{ fontSize: "0.85rem", color: "var(--text-main)" }}>{matchedUser.name}</strong>
                            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.4rem", borderRadius: "4px", backgroundColor: "rgba(11, 93, 82, 0.15)", color: "var(--royal-blue)", fontWeight: "700" }}>
                              {matchedUser.role}
                            </span>
                          </div>
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block" }}>
                            {matchedUser.email} • MTS No: {matchedUser.vmNo}
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.5rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Auto-detected HOD Name (or type manually if account is being created later):
                      </span>
                      <input 
                        type="text" 
                        placeholder="HOD Full Name (e.g. Dr. K. Muthukannan)" 
                        value={newDeptHod} 
                        onChange={(e) => setNewDeptHod(e.target.value)} 
                        className="premium-input" 
                      />
                    </div>
                  );
                })()}
              </div>

              <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="submit" className="btn-sky" style={{ flex: 1 }}>Create Department</button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowDeptModal(false);
                    setNewDeptCode("");
                    setNewDeptName("");
                    setNewDeptHod("");
                    setNewDeptHodVmNo("");
                  }} 
                  style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--text-main)", padding: "0.75rem 1rem", borderRadius: "8px", border: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {showNoticeModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "500px" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem" }}>Create System Announcement</h3>
            <form onSubmit={handleCreateNotice} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <input type="text" placeholder="Notice Title" value={newNoticeTitle} onChange={(e) => setNewNoticeTitle(e.target.value)} required className="premium-input" />
              <textarea placeholder="Notice Body & Details" value={newNoticeContent} onChange={(e) => setNewNoticeContent(e.target.value)} required className="premium-input" style={{ height: "100px", resize: "none" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Audience</label>
                  <select value={newNoticeAudience} onChange={(e) => setNewNoticeAudience(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                    <option value="ALL">ALL (Students & Faculty)</option>
                    <option value="STUDENT">STUDENT Only</option>
                    <option value="FACULTY">FACULTY Only</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Category</label>
                  <select value={newNoticeCategory} onChange={(e) => setNewNoticeCategory(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                    <option value="GENERAL">GENERAL</option>
                    <option value="EXAM">EXAM</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.25rem", display: "block" }}>Target Department (Optional)</label>
                <select value={newNoticeDept} onChange={(e) => setNewNoticeDept(e.target.value)} className="premium-input" style={{ width: "100%" }}>
                  <option value="">All Departments (Campus-wide)</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.code}>{d.code} - {d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>

                <button type="submit" className="btn-sky" style={{ flex: 1 }}>Broadcast Notice</button>
                <button type="button" onClick={() => setShowNoticeModal(false)} style={{ backgroundColor: "rgba(255,255,255,0.1)", color: "var(--text-main)", padding: "0.75rem 1rem", borderRadius: "8px", border: "none" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER TIMETABLE MODAL */}
      {userTimetableModalUser && (
        <div 
          className="admin-modal-overlay" 
          onClick={() => setUserTimetableModalUser(null)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="admin-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: "1200px", 
              width: "95vw", 
              maxHeight: "92vh", 
              overflowY: "auto", 
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
          >
            {/* Modal Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "12px",
                  backgroundColor: userTimetableModalUser.role === "STUDENT" ? "rgba(11, 93, 82, 0.15)" : userTimetableModalUser.role === "ADMIN" ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                  color: userTimetableModalUser.role === "STUDENT" ? "var(--royal-blue)" : userTimetableModalUser.role === "ADMIN" ? "#ef4444" : "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "800",
                  fontSize: "1.25rem"
                }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
                      {userTimetableModalUser.name}
                    </h2>
                    <span style={{ 
                      padding: "0.2rem 0.6rem", 
                      borderRadius: "4px", 
                      fontSize: "0.75rem", 
                      fontWeight: "700", 
                      backgroundColor: userTimetableModalUser.role === "ADMIN" ? "rgba(239,68,68,0.15)" : userTimetableModalUser.role === "HOD" ? "rgba(245,158,11,0.15)" : userTimetableModalUser.role === "FACULTY" ? "rgba(16,185,129,0.15)" : "rgba(11,93,82,0.15)", 
                      color: userTimetableModalUser.role === "ADMIN" ? "#ef4444" : userTimetableModalUser.role === "HOD" ? "#d97706" : userTimetableModalUser.role === "FACULTY" ? "#059669" : "var(--royal-blue)" 
                    }}>
                      {userTimetableModalUser.role === "FACULTY" ? "TEACHER" : userTimetableModalUser.role}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                    {userTimetableModalUser.email}
                    {userTimetableModalUser.vmNo ? ` • VM: ${userTimetableModalUser.vmNo}` : ""}
                    {userTimetableModalUser.studentProfile?.rollNumber ? ` • Roll: ${userTimetableModalUser.studentProfile.rollNumber}` : ""}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {userTimetableClassId && (
                  <button
                    onClick={() => jumpToTimetableTab("class", modalSelectedClass || userTimetableClassId)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(11, 93, 82, 0.15)",
                      color: "var(--sky-blue)",
                      border: "1px solid rgba(11, 93, 82, 0.3)",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <ArrowRight size={14} /> Open in Timetable Manager
                  </button>
                )}
                {userTimetableFacultyName && (
                  <button
                    onClick={() => jumpToTimetableTab("faculty", modalSelectedFaculty || userTimetableFacultyName)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "8px",
                      backgroundColor: "rgba(11, 93, 82, 0.15)",
                      color: "var(--sky-blue)",
                      border: "1px solid rgba(11, 93, 82, 0.3)",
                      fontSize: "0.8rem",
                      fontWeight: "600",
                      cursor: "pointer"
                    }}
                  >
                    <ArrowRight size={14} /> Open in Timetable Manager
                  </button>
                )}
                <button
                  onClick={() => setUserTimetableModalUser(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: "0.4rem",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                  title="Close Timetable"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Class / Faculty switcher bar */}
            {userTimetableModalUser.role === "STUDENT" && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", backgroundColor: "var(--bg-card-header)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                  Current Assigned Class: <strong style={{ color: "var(--sky-blue)" }}>{userTimetableClassId}</strong>
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>View Other Class:</label>
                  <select 
                    value={modalSelectedClass} 
                    onChange={(e) => handleModalClassChange(e.target.value)}
                    className="premium-input"
                    style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
                  >
                    {["II-CSE-A", "II-CSE-B", "II-CSE-C", "III-CSE-A", "III-CSE-B", "III-CSE-C", "IV-CSE-A", "IV-CSE-B", "IV-CSE-C"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {(userTimetableModalUser.role === "FACULTY" || userTimetableModalUser.role === "HOD") && (
              <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap", backgroundColor: "var(--bg-card-header)", padding: "0.75rem 1rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-main)" }}>
                  Faculty Schedule: <strong style={{ color: "var(--sky-blue)" }}>{userTimetableFacultyName}</strong>
                </span>
                {availableFaculty.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "auto" }}>
                    <label style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Switch Faculty:</label>
                    <select
                      value={modalSelectedFaculty}
                      onChange={(e) => handleModalFacultyChange(e.target.value)}
                      className="premium-input"
                      style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem", width: "auto" }}
                    >
                      {availableFaculty.map((f) => (
                        <option key={f.name} value={f.name}>{f.name} {f.vmsNo ? `(${f.vmsNo})` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Content / Loading / Error */}
            {loadingUserTimetable ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--sky-blue)", marginBottom: "0.5rem" }}>
                  Loading Timetable Schedule...
                </div>
                <p style={{ fontSize: "0.85rem", margin: 0 }}>Querying slots from college master timetable</p>
              </div>
            ) : userTimetableError === "ADMIN_ROLE" ? (
              <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", backgroundColor: "rgba(239, 68, 68, 0.05)", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <Shield size={36} color="#ef4444" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>
                  Administrator Account
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "450px", margin: "0 auto 1.5rem auto" }}>
                  Admin accounts do not have an individual class or faculty teaching schedule. You can view, verify, and modify all institution schedules directly in the Timetables tab.
                </p>
                <button
                  onClick={() => {
                    setUserTimetableModalUser(null);
                    setActiveTab("timetable");
                  }}
                  className="btn-royal"
                >
                  Go to Timetable Manager
                </button>
              </div>
            ) : userTimetableMap && userTimetableRaw.length > 0 ? (
              <div style={{ marginTop: "-1rem" }}>
                <OverallTimetable
                  fullTimetable={userTimetableMap}
                  currentDayOrder={["I", "II", "III", "IV", "V"][parseInt(currentDayOrderIndex, 10) || 0] || "I"}
                  title={`${userTimetableModalUser.name}'s Timetable`}
                  subtitle={userTimetableModalUser.role === "STUDENT" ? `Class: ${userTimetableClassId} • Total ${userTimetableRaw.length} Slots` : `Teaching Schedule: ${userTimetableFacultyName} • Total ${userTimetableRaw.length} Slots`}
                  mode={userTimetableModalUser.role === "STUDENT" ? "student" : "teacher"}
                  classId={userTimetableClassId}
                  facultyName={userTimetableFacultyName}
                  userDetails={{
                    name: userTimetableModalUser.name,
                    vmNo: userTimetableModalUser.vmNo || userTimetableModalUser.facultyProfile?.vmNo,
                    rollNumber: userTimetableModalUser.studentProfile?.rollNumber || userTimetableModalUser.vmNo,
                    department: userTimetableModalUser.studentProfile?.department || userTimetableModalUser.facultyProfile?.department,
                    designation: userTimetableModalUser.facultyProfile?.designation || (userTimetableModalUser.role === "STUDENT" ? "Student" : "Faculty"),
                    classId: userTimetableClassId,
                    semester: userTimetableModalUser.studentProfile?.semester,
                    section: userTimetableModalUser.studentProfile?.section,
                  }}
                />
              </div>
            ) : (
              <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", backgroundColor: "var(--bg-card-header)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <Calendar size={36} color="var(--sky-blue)" style={{ margin: "0 auto 1rem auto" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", margin: "0 0 0.5rem 0", color: "var(--text-main)" }}>
                  No Timetable Slots Found
                </h3>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "480px", margin: "0 auto 1.5rem auto" }}>
                  {userTimetableError || `No timetable slots were recorded in the database for ${userTimetableClassId || userTimetableFacultyName || userTimetableModalUser.name}.`}
                </p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button
                    onClick={() => {
                      setUserTimetableModalUser(null);
                      setActiveTab("upload-timetable");
                    }}
                    className="btn-sky"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Upload Timetable PDF
                  </button>
                  <button
                    onClick={() => {
                      setUserTimetableModalUser(null);
                      setActiveTab("timetable");
                    }}
                    className="btn-royal"
                    style={{ fontSize: "0.85rem" }}
                  >
                    Manage Timetables
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* TIMETABLE HISTORY MODAL */}
      {showHistoryModal && (
        <div 
          className="admin-modal-overlay" 
          onClick={() => setShowHistoryModal(false)}
          style={{ zIndex: 1100 }}
        >
          <div 
            className="admin-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: "1100px", 
              width: "95vw", 
              maxHeight: "90vh", 
              overflowY: "auto", 
              padding: "1.75rem",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", backgroundColor: "rgba(11, 93, 82, 0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sky-blue)" }}>
                  <History size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: "1.25rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                    Timetable History & Archival Log
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.2rem 0 0 0" }}>
                    Filter and view archived semester & academic year timetables for any class
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowHistoryModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "0.4rem" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* CRITERIA FILTER BAR: Academic Year, Sem (Odd/Even), Dept, Year (1,2,3,4), Section */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.75rem",
              padding: "1rem",
              backgroundColor: "var(--bg-input)",
              borderRadius: "10px",
              border: "1px solid var(--border-subtle)",
              alignItems: "flex-end"
            }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
                  Academic Year
                </label>
                <select
                  value={historyFilterAcadYear}
                  onChange={(e) => setHistoryFilterAcadYear(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", fontSize: "0.82rem", padding: "0.45rem" }}
                >
                  <option value="ALL">All Academic Years</option>
                  <option value="2026-2027">2026 - 2027</option>
                  <option value="2025-2026">2025 - 2026</option>
                  <option value="2024-2025">2024 - 2025</option>
                  <option value="2023-2024">2023 - 2024</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
                  Semester (Odd / Even)
                </label>
                <select
                  value={historyFilterSemType}
                  onChange={(e) => setHistoryFilterSemType(e.target.value as any)}
                  className="premium-input"
                  style={{ width: "100%", fontSize: "0.82rem", padding: "0.45rem" }}
                >
                  <option value="ALL">All Semesters</option>
                  <option value="ODD">Odd Semesters (1, 3, 5, 7)</option>
                  <option value="EVEN">Even Semesters (2, 4, 6, 8)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
                  Department
                </label>
                <select
                  value={historyFilterDept}
                  onChange={(e) => setHistoryFilterDept(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", fontSize: "0.82rem", padding: "0.45rem" }}
                >
                  <option value="ALL">All Departments</option>
                  {depts.length > 0 ? (
                    depts.map((d) => (
                      <option key={d.code} value={d.code}>{d.code} - {d.name}</option>
                    ))
                  ) : (
                    <>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="AIDS">AIDS</option>
                      <option value="MECH">MECH</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
                  Year (1, 2, 3, 4)
                </label>
                <select
                  value={historyFilterYear}
                  onChange={(e) => setHistoryFilterYear(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", fontSize: "0.82rem", padding: "0.45rem" }}
                >
                  <option value="ALL">All Years</option>
                  <option value="I">Year 1 (I)</option>
                  <option value="II">Year 2 (II)</option>
                  <option value="III">Year 3 (III)</option>
                  <option value="IV">Year 4 (IV)</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.3rem" }}>
                  Section
                </label>
                <select
                  value={historyFilterSection}
                  onChange={(e) => setHistoryFilterSection(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", fontSize: "0.82rem", padding: "0.45rem" }}
                >
                  <option value="ALL">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => fetchTimetableHistory()}
                  disabled={loadingHistory}
                  className="btn-royal"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1rem",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    flex: 1,
                    height: "38px"
                  }}
                >
                  {loadingHistory ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Find History
                </button>
              </div>
            </div>

            {loadingHistory ? (
              <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
                <Loader2 size={30} className="animate-spin" style={{ margin: "0 auto 1rem auto" }} />
                Loading archived timetable snapshots...
              </div>
            ) : timetableHistoryVersions.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", backgroundColor: "var(--bg-card-header)", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
                <History size={36} color="var(--sky-blue)" style={{ margin: "0 auto 1rem auto", opacity: 0.7 }} />
                <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "var(--text-main)" }}>
                  No Timetable History Recorded Yet
                </h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "500px", marginInline: "auto" }}>
                  Whenever this class's timetable is updated, edited, or advanced to a new semester/year, the existing schedule is automatically archived here first before writing to the master timetable.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Version Selector Tabs */}
                <div>
                  <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginBottom: "0.4rem", display: "block" }}>
                    Archived Snapshots ({timetableHistoryVersions.length} versions saved)
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
                    {timetableHistoryVersions.map((v, idx) => {
                      const isSelected = selectedHistoryVersion?.versionId === v.versionId;
                      const dateStr = v.archivedAt ? new Date(v.archivedAt).toLocaleString() : `Snapshot #${idx + 1}`;
                      return (
                        <button
                          key={v.versionId}
                          onClick={() => setSelectedHistoryVersion(v)}
                          style={{
                            padding: "0.5rem 0.85rem",
                            borderRadius: "8px",
                            border: isSelected ? "1px solid var(--sky-blue)" : "1px solid var(--border-subtle)",
                            backgroundColor: isSelected ? "rgba(11, 93, 82, 0.15)" : "var(--bg-card-header)",
                            color: isSelected ? "var(--sky-blue)" : "var(--text-main)",
                            cursor: "pointer",
                            fontSize: "0.8rem",
                            fontWeight: isSelected ? "700" : "500",
                            whiteSpace: "nowrap",
                            textAlign: "left"
                          }}
                        >
                          <div>📅 {dateStr}</div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {v.changeReason || "Archived Schedule"} • {v.entriesCount} periods
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Version Details & Schedule Matrix */}
                {selectedHistoryVersion && (
                  <div style={{ backgroundColor: "var(--bg-card)", padding: "1.25rem", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <div>
                        <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--text-main)" }}>
                          {selectedHistoryVersion.changeReason || "Archived Snapshot"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                          Archived on: {new Date(selectedHistoryVersion.archivedAt).toLocaleString()} • Archived By: {selectedHistoryVersion.archivedBy || "System Admin"}
                          {selectedHistoryVersion.semester ? ` • Semester: ${selectedHistoryVersion.semester}` : ""}
                          {selectedHistoryVersion.academicYear ? ` • Academic Year: ${selectedHistoryVersion.academicYear}` : ""}
                        </div>
                      </div>

                      <button
                        onClick={async () => {
                          if (!confirm(`Restore this archived timetable snapshot (${selectedHistoryVersion.entries?.length || 0} periods) back to the active master timetable for ${selectedYear}-${selectedDept}-${selectedSection}? The current active timetable will be saved to history first.`)) return;
                          setLoadingTimetable(true);
                          setShowHistoryModal(false);
                          const classId = `${selectedYear}-${selectedDept}-${selectedSection}`;
                          try {
                            const res = await fetch("/api/admin/timetable", {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                classId,
                                entries: selectedHistoryVersion.entries || [],
                                academicYear: selectedHistoryVersion.academicYear,
                                semester: selectedHistoryVersion.semester,
                                changeReason: `Restored from History Snapshot (${selectedHistoryVersion.versionId})`
                              })
                            }).then(r => r.json());
                            if (res.success) {
                              alert(`Successfully restored timetable from snapshot! (${res.count} periods restored, old timetable archived to history).`);
                              setTimetable(selectedHistoryVersion.entries || []);
                            } else {
                              alert("Failed to restore: " + res.error);
                            }
                          } catch (err: any) {
                            alert("Restore error: " + err.message);
                          } finally {
                            setLoadingTimetable(false);
                          }
                        }}
                        className="btn-sky"
                        style={{ fontSize: "0.8rem", padding: "0.4rem 0.85rem" }}
                      >
                        Restore This Version to Master Timetable
                      </button>
                    </div>

                    {/* Table View of Historical Snapshot */}
                    <div className="responsive-table-wrapper">
                      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.82rem", minWidth: "800px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)", color: "var(--text-muted)" }}>
                            <th style={{ padding: "0.75rem", width: "70px" }}>Day</th>
                            {[1,2,3,4,5,6,7,8].map(p => <th key={p} style={{ padding: "0.75rem" }}>Period {p}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {["I", "II", "III", "IV", "V"].map(day => (
                            <tr key={day} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                              <td style={{ padding: "0.75rem", fontWeight: "700", borderRight: "1px solid var(--border-subtle)", backgroundColor: "var(--bg-card-header)" }}>Day {day}</td>
                              {[1,2,3,4,5,6,7,8].map(period => {
                                const matching = (selectedHistoryVersion.entries || []).filter((e: any) => e.dayOrder === day && e.period === period);
                                return (
                                  <td key={period} style={{ padding: "0.5rem", borderRight: "1px solid var(--border-subtle)", verticalAlign: "top" }}>
                                    {matching.length > 0 ? (
                                      matching.map((m: any, mIdx: number) => (
                                        <div key={mIdx} style={{ display: "flex", flexDirection: "column", gap: "0.15rem", marginBottom: matching.length > 1 ? "0.3rem" : "0" }}>
                                          <strong style={{ color: "var(--sky-blue)", fontSize: "0.8rem" }}>{m.subjectName || m.subjectCode || "-"}</strong>
                                          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{m.facultyName || "No Faculty"}</span>
                                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", flexWrap: "wrap" }}>
                                            {m.roomNo && <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>Room: {m.roomNo}</span>}
                                            {(m.semType || selectedHistoryVersion.semType) && (
                                              <span style={{
                                                fontSize: "0.6rem",
                                                fontWeight: 700,
                                                padding: "0.05rem 0.3rem",
                                                borderRadius: "3px",
                                                backgroundColor: (m.semType || selectedHistoryVersion.semType).toUpperCase() === "ODD" ? "rgba(122, 106, 158, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                                color: (m.semType || selectedHistoryVersion.semType).toUpperCase() === "ODD" ? "#7a6a9e" : "#10b981",
                                                border: (m.semType || selectedHistoryVersion.semType).toUpperCase() === "ODD" ? "1px solid rgba(122, 106, 158, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                              }}>
                                                Sem ({(m.semType || selectedHistoryVersion.semType).toUpperCase() === "ODD" ? "Odd" : "Even"})
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <span style={{ color: "var(--border-subtle)", fontSize: "0.75rem" }}>-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <AdminAgentChat onTimetableUpdated={fetchData} />
    </div>
  );
}
