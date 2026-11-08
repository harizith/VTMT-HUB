"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  UserCheck,
  Shuffle,
  Calendar,
  Building2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  X
} from "lucide-react";

interface TeacherItem {
  id: string;
  name: string;
  vmNo?: string | null;
  role: string;
  department?: string | null;
  designation?: string | null;
  subject1?: string | null;
  subject2?: string | null;
  lab1?: string | null;
  lab2?: string | null;
  additional1?: string | null;
  additional2?: string | null;
}

interface SubjectItem {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  departmentCode: string;
}

interface TeacherAllocationProps {
  departments: { code: string; name: string }[];
  initialTargetCourse?: SubjectItem | null;
  onTimetableGenerated?: (classId: string) => void;
  onCourseUpdated?: () => void;
  onBackToCatalog?: () => void;
}

export default function TeacherSubjectAllocation({
  departments = [],
  initialTargetCourse,
  onTimetableGenerated,
  onCourseUpdated,
  onBackToCatalog,
}: TeacherAllocationProps) {
  // Target Class Selection
  const [selectedDept, setSelectedDept] = useState<string>("CSE");
  const [selectedYear, setSelectedYear] = useState<string>("II");
  const [selectedSection, setSelectedSection] = useState<string>("A");
  const [highlightedCourseCode, setHighlightedCourseCode] = useState<string | null>(null);

  // Data State
  const [catalogSubjects, setCatalogSubjects] = useState<SubjectItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [savingAllocations, setSavingAllocations] = useState<boolean>(false);

  // Subject-to-Teacher Mappings: subjectCode -> { facultyName, vmsNo, roomNo }
  const [assignments, setAssignments] = useState<
    Record<string, { facultyName: string; vmsNo: string; roomNo: string }>
  >({});

  // Per-subject Period Rules: subjectCode -> { periodsPerWeek: number, isContinuous: boolean }
  const [subjectRules, setSubjectRules] = useState<
    Record<string, { periodsPerWeek: number; isContinuous: boolean }>
  >({});

  // Priority Special Slots Configuration (Sports, Electives, Library)
  const [sportsConfig, setSportsConfig] = useState<{
    enabled: boolean;
    dayOrder: string;
    periods: [number, number]; // e.g. [7, 8]
    roomNo: string;
    facultyName: string;
  }>({
    enabled: true,
    dayOrder: "V", // Day Order V by default
    periods: [7, 8], // Last 2 periods
    roomNo: "GROUND",
    facultyName: "Physical Director",
  });

  const [libraryConfig, setLibraryConfig] = useState<{
    enabled: boolean;
    dayOrder: string;
    period: number;
    roomNo: string;
  }>({
    enabled: true,
    dayOrder: "III",
    period: 6,
    roomNo: "CENTRAL-LIB",
  });

  const [electiveConfig, setElectiveConfig] = useState<{
    enabled: boolean;
    code: string;
    name: string;
    dayOrder: string;
    periods: [number, number]; // e.g. [5, 6]
    facultyName: string;
    faculty1: string;
    faculty2: string;
    faculty3: string;
    roomNo: string;
  }>({
    enabled: false,
    code: "EP-OPEN",
    name: "Professional Elective / Open Elective",
    dayOrder: "IV",
    periods: [5, 6],
    facultyName: "Elective Coordinator",
    faculty1: "",
    faculty2: "",
    faculty3: "",
    roomNo: "AUDITORIUM",
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "LAB" | "THEORY">("ALL");

  // Execution State
  const [isRandomizing, setIsRandomizing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Subject Management Modal State (Create subject in Course Catalog directly from Allocation view)
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubCode, setNewSubCode] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [newSubCredits, setNewSubCredits] = useState("3");
  const [newSubSem, setNewSubSem] = useState("3");
  const [newSubDept, setNewSubDept] = useState("CSE");
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [deletingSubjectId, setDeletingSubjectId] = useState<string | null>(null);

  // Computed Class ID (e.g. "II-CSE-A")
  const computedClassId = useMemo(() => {
    return `${selectedYear}-${selectedDept}-${selectedSection}`;
  }, [selectedYear, selectedDept, selectedSection]);

  // Compute semester number from academic year
  const computedSemester = useMemo(() => {
    if (selectedYear === "I") return 1;
    if (selectedYear === "II") return 3;
    if (selectedYear === "III") return 5;
    if (selectedYear === "IV") return 7;
    return 3;
  }, [selectedYear]);

  // Fetch teachers and catalog subjects
  const loadData = async () => {
    try {
      setRefreshing(true);
      // 1. Fetch Teachers from /api/admin/users
      const usersRes = await fetch("/api/admin/users").then((r) => r.json());
      if (usersRes.success && usersRes.users) {
        const teacherList: TeacherItem[] = usersRes.users
          .filter((u: any) => u.role === "FACULTY" || u.role === "HOD")
          .map((u: any) => ({
            id: u.id,
            name: u.name,
            vmNo: u.facultyProfile?.vmNo || u.vmNo || null,
            role: u.role,
            department: u.facultyProfile?.department || null,
            designation: u.facultyProfile?.designation || null,
            subject1: u.facultyProfile?.subject1 || null,
            subject2: u.facultyProfile?.subject2 || null,
            lab1: u.facultyProfile?.lab1 || null,
            lab2: u.facultyProfile?.lab2 || null,
            additional1: u.facultyProfile?.additional1 || null,
            additional2: u.facultyProfile?.additional2 || null,
          }));
        setTeachers(teacherList);
      }

      // 2. Fetch Catalog Subjects
      const subjectsRes = await fetch("/api/admin/subjects").then((r) => r.json());
      if (subjectsRes.success && subjectsRes.subjects) {
        const subs: any[] = subjectsRes.subjects;
        setCatalogSubjects(subs);
        populateClassAssignments(subs, usersRes?.users || [], computedClassId);
      }
    } catch (err: any) {
      console.error("Error loading allocation data:", err);
      setStatusMessage({ type: "error", text: "Failed to load faculty and course catalog." });
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  };

  // Helper: Populate assignments for a specific class section
  const populateClassAssignments = (subs: SubjectItem[], allUsers: any[], targetClassId: string) => {
    setAssignments((prev) => {
      const classMap: Record<string, { facultyName: string; vmsNo: string; roomNo: string }> = {};

      // Helper: get aliases for classId comparison
      const targetAliases = [
        targetClassId.toUpperCase(),
        targetClassId.toUpperCase().replace(/^([IV]+)-/, (m, y) => {
          if (y === "I") return "1-";
          if (y === "II") return "2-";
          if (y === "III") return "3-";
          if (y === "IV") return "4-";
          return m;
        }),
        targetClassId.toUpperCase().replace(/^([1-4])-/, (m, y) => {
          if (y === "1") return "I-";
          if (y === "2") return "II-";
          if (y === "3") return "III-";
          if (y === "4") return "IV-";
          return m;
        }),
      ];

      subs.forEach((sub: any) => {
        // Priority 1: Check if there is an existing schedule slot specifically for this class
        let classSlotFaculty = "";
        let classSlotRoom = "";
        let classSlotVm = "";

        if (sub.scheduleSlots && Array.isArray(sub.scheduleSlots)) {
          const matchingSlot = sub.scheduleSlots.find(
            (slot: any) => slot.classId && targetAliases.includes(slot.classId.toUpperCase())
          );
          if (matchingSlot && matchingSlot.facultyName) {
            classSlotFaculty = matchingSlot.facultyName;
            classSlotRoom = matchingSlot.roomNo || "";
            classSlotVm = matchingSlot.vmsNo || "";
          }
        }

        // If this class has its own assigned teacher in the timetable, use it!
        if (classSlotFaculty) {
          const staffNames = classSlotFaculty.split(/[,/]+/).map((s: string) => s.trim()).filter(Boolean);
          const vmsList = staffNames.map((name: string) => {
            const matched = (allUsers || []).find((u: any) => {
              const uName = (u.name || "").toLowerCase().trim();
              const fName = name.toLowerCase().trim();
              return (
                uName === fName ||
                uName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, "") === fName.replace(/^(dr|mr|ms|mrs)\.?\s*/i, "")
              );
            });
            return matched?.vmNo || matched?.facultyProfile?.vmNo || "";
          });

          classMap[sub.code] = {
            facultyName: classSlotFaculty,
            vmsNo: classSlotVm || vmsList.join(", "),
            roomNo: classSlotRoom || (sub.code.toLowerCase().includes("lab") ? "CS-LAB-1" : "LH-201"),
          };
        } else if (prev[sub.code]) {
          // Keep existing pending user edits
          classMap[sub.code] = prev[sub.code];
        } else {
          // Empty assignment so each class can choose its own teacher
          classMap[sub.code] = {
            facultyName: "",
            vmsNo: "",
            roomNo: sub.code.toLowerCase().includes("lab") ? "CS-LAB-1" : "LH-201",
          };
        }
      });
      return classMap;
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // When class selection (year, dept, section) changes, reload class-specific assignments
  useEffect(() => {
    if (catalogSubjects.length > 0) {
      populateClassAssignments(catalogSubjects, teachers, computedClassId);
    }
  }, [computedClassId]);

  // Scope filter: "SEMESTER" (default for target class), "ALL_CATALOG" (every course catalog subject), or specific semester "1".."8"
  const [semesterFilter, setSemesterFilter] = useState<string>("SEMESTER");

  // When initialTargetCourse changes, auto-switch to its department and semester
  useEffect(() => {
    if (initialTargetCourse) {
      if (initialTargetCourse.departmentCode) {
        setSelectedDept(initialTargetCourse.departmentCode);
      }
      if (initialTargetCourse.semester) {
        const sem = initialTargetCourse.semester;
        if (sem <= 2) setSelectedYear("I");
        else if (sem <= 4) setSelectedYear("II");
        else if (sem <= 6) setSelectedYear("III");
        else setSelectedYear("IV");
      }
      setHighlightedCourseCode(initialTargetCourse.code);
      setSemesterFilter("ALL_CATALOG");
      setSearchQuery(initialTargetCourse.code);

      // Scroll into view after render
      setTimeout(() => {
        const el = document.getElementById(`allocation-row-${initialTargetCourse.code}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 500);
    }
  }, [initialTargetCourse]);

  // Filter subjects based on scope, department, semester, search, and lab/theory
  const relevantSubjects = useMemo(() => {
    return catalogSubjects.filter((s) => {
      // If showing all catalog subjects, don't restrict department or semester unless explicitly chosen
      const matchDept =
        semesterFilter === "ALL_CATALOG"
          ? true
          : !selectedDept ||
            s.departmentCode.toUpperCase() === selectedDept.toUpperCase() ||
            s.departmentCode.toUpperCase() === "ALL";

      // Match semester
      let matchSem = true;
      if (semesterFilter === "ALL_CATALOG") {
        matchSem = true;
      } else if (semesterFilter === "YEAR") {
        const allowedSems = [computedSemester, computedSemester + 1];
        matchSem = allowedSems.includes(s.semester);
      } else if (semesterFilter === "SEMESTER") {
        matchSem = s.semester === computedSemester;
      } else if (semesterFilter === "ODD_SEMS") {
        matchSem = s.semester % 2 !== 0;
      } else if (semesterFilter === "EVEN_SEMS") {
        matchSem = s.semester % 2 === 0;
      } else if (semesterFilter !== "ALL") {
        const targetSem = parseInt(semesterFilter);
        if (!isNaN(targetSem)) {
          matchSem = s.semester === targetSem;
        }
      }

      // Search query
      const matchSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.departmentCode.toLowerCase().includes(searchQuery.toLowerCase());

      // Lab vs Theory
      const isLab = s.name.toLowerCase().includes("lab") || s.code.toLowerCase().includes("lab");
      const matchType =
        filterType === "ALL" ? true : filterType === "LAB" ? isLab : !isLab;

      return matchDept && matchSem && matchSearch && matchType;
    });
  }, [catalogSubjects, semesterFilter, selectedDept, computedSemester, searchQuery, filterType]);

  // Check if subject is Lab
  const checkIfLab = (sub: SubjectItem) => {
    const text = `${sub.name} ${sub.code}`.toLowerCase();
    return text.includes("lab") || text.includes("practical") || text.includes("workshop");
  };

  // Check if subject is Elective (professional elective / open elective)
  const checkIfElective = (sub: SubjectItem) => {
    const text = `${sub.name} ${sub.code}`.toLowerCase();
    return (
      text.includes("elective") ||
      text.includes(" pe ") ||
      text.includes(" oe ") ||
      text.startsWith("pe") ||
      text.startsWith("oe") ||
      text.includes("open elective") ||
      text.includes("prof elective")
    );
  };

  // Update assignment for a subject (supports multi-staff for labs and electives)
  const handleTeacherSelect = (subCode: string, teacherName: string, slotIndex: number = 0) => {
    setAssignments((prev) => {
      const existing = prev[subCode] || { facultyName: "", vmsNo: "", roomNo: subCode.toLowerCase().includes("lab") ? "CS-LAB-1" : "LH-201" };
      const currentNames = (existing.facultyName || "").split(/[,/]+/).map((s) => s.trim()).filter(Boolean);
      const currentVms = (existing.vmsNo || "").split(/[,/]+/).map((s) => s.trim()).filter(Boolean);

      const matchedTeacher = teachers.find((t) => t.name === teacherName);
      const teacherVm = matchedTeacher?.vmNo || "";

      if (!teacherName) {
        // Remove staff at slotIndex
        currentNames.splice(slotIndex, 1);
        currentVms.splice(slotIndex, 1);
      } else {
        // Set staff at slotIndex
        currentNames[slotIndex] = teacherName;
        currentVms[slotIndex] = teacherVm;
      }

      return {
        ...prev,
        [subCode]: {
          facultyName: currentNames.join(", "),
          vmsNo: currentVms.join(", "),
          roomNo: existing.roomNo || (subCode.toLowerCase().includes("lab") ? "CS-LAB-1" : "LH-201"),
        },
      };
    });
  };

  const handleRoomChange = (subCode: string, roomNo: string) => {
    setAssignments((prev) => ({
      ...prev,
      [subCode]: {
        facultyName: prev[subCode]?.facultyName || "",
        vmsNo: prev[subCode]?.vmsNo || "",
        roomNo,
      },
    }));
  };

  // Auto-fill unassigned subjects: prioritize teachers whose profile teaching assignments match this subject
  const handleAutoAssignTeachers = () => {
    if (teachers.length === 0) {
      alert("No faculty members registered in system. Please add faculty in User Accounts first.");
      return;
    }

    const updated = { ...assignments };
    relevantSubjects.forEach((sub, idx) => {
      if (!updated[sub.code]?.facultyName) {
        // Priority 1: Check if any teacher has this course code/title in their profile teaching assignments
        const subNameLower = sub.name.toLowerCase();
        const subCodeLower = sub.code.toLowerCase();

        const profileMatchedTeacher = teachers.find((t) => {
          const profileSubjects = [t.subject1, t.subject2, t.lab1, t.lab2, t.additional1, t.additional2]
            .filter(Boolean)
            .map((s) => String(s).toLowerCase().trim());

          return profileSubjects.some(
            (ps) => ps === subCodeLower || ps === subNameLower || subNameLower.includes(ps) || ps.includes(subNameLower)
          );
        });

        // Priority 2: Fallback to department matching faculty in round-robin
        const deptTeachers = teachers.filter(
          (t) => !t.department || t.department.toUpperCase() === selectedDept.toUpperCase()
        );
        const pool = deptTeachers.length > 0 ? deptTeachers : teachers;
        const assignedTeacher = profileMatchedTeacher || pool[idx % pool.length];

        updated[sub.code] = {
          facultyName: assignedTeacher.name,
          vmsNo: assignedTeacher.vmNo || "",
          roomNo: checkIfLab(sub) ? `LAB-${(idx % 3) + 1}` : `LH-${200 + (idx % 4) + 1}`,
        };
      }
    });

    setAssignments(updated);
    setStatusMessage({
      type: "info",
      text: `Auto-mapped teachers to ${relevantSubjects.length} subjects for ${computedClassId} (prioritizing profile teaching assignments).`,
    });
  };

  // Clear all selections for current view
  const handleClearAssignments = () => {
    if (!confirm("Clear selected teacher assignments for this view?")) return;
    setAssignments({});
    setStatusMessage(null);
  };

  // Create subject in Course Catalog from allocation tab
  const handleOpenCreateModal = () => {
    setNewSubDept(selectedDept);
    setNewSubSem(computedSemester.toString());
    setNewSubCode("");
    setNewSubName("");
    setNewSubCredits("3");
    setShowAddSubjectModal(true);
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubCode.trim() || !newSubName.trim()) {
      alert("Please provide both Subject Code and Name.");
      return;
    }

    try {
      setCreatingSubject(true);
      const res = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newSubCode.trim().toUpperCase(),
          name: newSubName.trim(),
          credits: parseInt(newSubCredits) || 3,
          semester: parseInt(newSubSem) || computedSemester,
          departmentCode: newSubDept || selectedDept,
        }),
      }).then((r) => r.json());

      if (res.success) {
        setShowAddSubjectModal(false);
        setNewSubCode("");
        setNewSubName("");
        setStatusMessage({
          type: "success",
          text: `Subject "${res.subject.code} - ${res.subject.name}" successfully added to Course Catalog!`,
        });
        await loadData();
        if (onCourseUpdated) onCourseUpdated();
      } else {
        alert(res.error || "Failed to create subject.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to create subject.");
    } finally {
      setCreatingSubject(false);
    }
  };

  // Connect & Save Teacher-Subject Allocations directly to database & Course Catalog
  const handleSaveAllocationsToCatalog = async () => {
    const assignedEntries = Object.entries(assignments).filter(([_, val]) => val.facultyName);
    if (assignedEntries.length === 0) {
      alert("No teachers are currently selected for any subjects in this view. Please assign at least one teacher.");
      return;
    }

    try {
      setSavingAllocations(true);
      setStatusMessage({
        type: "info",
        text: `Syncing and saving teacher allocations for ${assignedEntries.length} subjects to Course Catalog and faculty profiles...`,
      });

      // Save assignments to database through batch subject allocation endpoint
      const res = await fetch("/api/admin/subjects/allocate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: computedClassId,
          departmentCode: selectedDept,
          allocations: assignedEntries.map(([code, val]) => ({
            subjectCode: code,
            facultyName: val.facultyName,
            vmsNo: val.vmsNo || null,
            roomNo: val.roomNo || null,
          })),
        }),
      }).then((r) => r.json());

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Successfully connected & saved allocations for ${assignedEntries.length} subjects! Course Catalog and Faculty Directory now reflect these teacher assignments.`,
        });
        await loadData();
        if (onCourseUpdated) onCourseUpdated();
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to save teacher allocations.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Error saving allocations.",
      });
    } finally {
      setSavingAllocations(false);
    }
  };

  // Delete subject from Course Catalog
  const handleDeleteSubject = async (sub: SubjectItem) => {
    if (!confirm(`Are you sure you want to delete course "${sub.code} - ${sub.name}" from the Course Catalog?`)) {
      return;
    }

    try {
      setDeletingSubjectId(sub.id);
      const res = await fetch(`/api/admin/subjects?id=${encodeURIComponent(sub.id)}`, {
        method: "DELETE",
      }).then((r) => r.json());

      if (res.success) {
        // Also remove from assignments if mapped
        setAssignments((prev) => {
          const next = { ...prev };
          delete next[sub.code];
          return next;
        });
        setStatusMessage({
          type: "info",
          text: `Subject "${sub.code}" removed from Course Catalog and allocation list.`,
        });
        await loadData();
        if (onCourseUpdated) onCourseUpdated();
      } else {
        alert(res.error || "Failed to delete subject.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete subject.");
    } finally {
      setDeletingSubjectId(null);
    }
  };

  // Trigger Randomize Timetable with Selected Subject-Teacher Mappings
  const handleExecuteRandomize = async () => {
    setIsRandomizing(true);
    setStatusMessage(null);

    try {
      // Build teacherAssignments dictionary for the API payload
      const payloadAssignments: Record<
        string,
        { facultyName: string | null; vmsNo: string | null; roomNo: string | null }
      > = {};

      Object.entries(assignments).forEach(([code, val]) => {
        if (val.facultyName) {
          payloadAssignments[code] = {
            facultyName: val.facultyName,
            vmsNo: val.vmsNo || null,
            roomNo: val.roomNo || null,
          };
        }
      });

      // Build subjectRules dictionary
      const payloadRules: Record<string, { periodsPerWeek: number; isContinuous: boolean }> = {};
      Object.entries(subjectRules).forEach(([code, r]) => {
        payloadRules[code] = r;
      });

      const combinedElectiveFaculty = [
        electiveConfig.faculty1,
        electiveConfig.faculty2,
        electiveConfig.faculty3,
      ].filter(Boolean).join(", ") || electiveConfig.facultyName || "Elective Coordinator";

      const res = await fetch("/api/admin/timetable/randomize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classId: computedClassId,
          teacherAssignments: payloadAssignments,
          subjectRules: payloadRules,
          sportsConfig,
          libraryConfig,
          electiveConfig: {
            ...electiveConfig,
            facultyName: combinedElectiveFaculty,
          },
        }),
      }).then((r) => r.json());

      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Timetable for ${computedClassId} successfully scheduled & randomized with selected subject teachers! (Filled ${res.filledCount || 0} periods).`,
        });
        if (onTimetableGenerated) {
          onTimetableGenerated(computedClassId);
        }
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "Failed to randomize timetable.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Network error while running randomize engine.",
      });
    } finally {
      setIsRandomizing(false);
    }
  };

  const assignedCount = relevantSubjects.filter(
    (s) => assignments[s.code]?.facultyName
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner & Control Deck */}
      <div
        className="premium-card"
        style={{
          background: "linear-gradient(135deg, rgba(30, 64, 175, 0.25) 0%, rgba(14, 165, 233, 0.15) 100%)",
          border: "1px solid rgba(94, 39, 80, 0.3)",
          padding: "1.75rem",
          borderRadius: "16px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  backgroundColor: "rgba(94, 39, 80, 0.2)",
                  color: "var(--sky-blue)",
                  border: "1px solid rgba(94, 39, 80, 0.35)",
                }}
              >
                <UserCheck size={14} /> Subject Allocation & Randomizer Deck
              </span>
              <span
                style={{
                  padding: "0.2rem 0.6rem",
                  borderRadius: "9999px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  backgroundColor: "rgba(95, 115, 150, 0.2)",
                  color: "#5f7396",
                }}
              >
                Rule Compliant (Max 6P • Non-consecutive • Daily)
              </span>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", margin: "0.25rem 0", color: "var(--text-main)" }}>
              Subject-Handling Teacher Allocations
            </h2>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-muted)", maxWidth: "680px" }}>
              Select which professor or lecturer handles each catalog course for the selected class.
              Then click <strong>Run Randomize with Selected Teachers</strong> to generate a fully compliant timetable.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {onBackToCatalog && (
              <button
                onClick={onBackToCatalog}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.9rem",
                  borderRadius: "8px",
                  border: "1px solid var(--sky-blue)",
                  backgroundColor: "rgba(94, 39, 80, 0.12)",
                  color: "var(--sky-blue)",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                <BookOpen size={14} /> Back to Course Catalog
              </button>
            )}

            <button
              onClick={loadData}
              disabled={refreshing}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-card)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: refreshing ? "not-allowed" : "pointer",
              }}
            >
              <RefreshCw size={14} className={refreshing ? "spin" : ""} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Class Selection Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "var(--bg-card)",
            borderRadius: "12px",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              <Building2 size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              DEPARTMENT
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="premium-input"
              style={{ width: "100%", fontSize: "0.85rem" }}
            >
              {(departments.length > 0 ? departments : [{ code: "CSE", name: "CSE" }, { code: "ECE", name: "ECE" }, { code: "IT", name: "IT" }, { code: "MECH", name: "MECH" }]).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              <GraduationCap size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              ACADEMIC YEAR
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="premium-input"
              style={{ width: "100%", fontSize: "0.85rem" }}
            >
              <option value="I">Year I (Sem 1-2)</option>
              <option value="II">Year II (Sem 3-4)</option>
              <option value="III">Year III (Sem 5-6)</option>
              <option value="IV">Year IV (Sem 7-8)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "0.75rem", fontWeight: "600", color: "var(--text-muted)", marginBottom: "0.35rem" }}>
              <Users size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              SECTION
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="premium-input"
              style={{ width: "100%", fontSize: "0.85rem" }}
            >
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
            <div
              style={{
                padding: "0.6rem 0.9rem",
                borderRadius: "8px",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>ALLOCATING FOR CLASS</span>
              <strong style={{ fontSize: "1rem", color: "var(--sky-blue)", letterSpacing: "0.03em" }}>{computedClassId}</strong>
              <span style={{ fontSize: "0.68rem", color: "#10b981", display: "block", marginTop: "2px", fontWeight: "600" }}>
                ✓ Independent Staff per Section
              </span>
            </div>
          </div>
        </div>

        {/* Priority Special Slots Deck (Sports, Electives, Library) */}
        <div
          style={{
            marginTop: "1rem",
            padding: "1rem 1.25rem",
            backgroundColor: "rgba(15, 23, 42, 0.45)",
            borderRadius: "12px",
            border: "1px solid rgba(94, 39, 80, 0.25)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--sky-blue)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                ⚡ Priority Slots Allocation Engine
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                (1. Sports 2-P • 2. Electives • 3. Library • Labs & Theory in Table Below)
              </span>
            </div>
            <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.5rem", borderRadius: "6px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#10b981", fontWeight: "600" }}>
              Sync Across Year & Dept • Zero Faculty Clashes
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            {/* 1. Sports Priority */}
            <div style={{ padding: "0.85rem", borderRadius: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#8e4a7d", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={sportsConfig.enabled}
                    onChange={(e) => setSportsConfig({ ...sportsConfig, enabled: e.target.checked })}
                    style={{ accentColor: "#8e4a7d", cursor: "pointer" }}
                  />
                  1. Sports (2 Continuous Periods)
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Year-synchronized</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Day Order</span>
                  <select
                    disabled={!sportsConfig.enabled}
                    value={sportsConfig.dayOrder}
                    onChange={(e) => setSportsConfig({ ...sportsConfig, dayOrder: e.target.value })}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    {["I", "II", "III", "IV", "V"].map((d) => (
                      <option key={d} value={d}>Day Order {d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Time Slot</span>
                  <select
                    disabled={!sportsConfig.enabled}
                    value={`${sportsConfig.periods[0]}-${sportsConfig.periods[1]}`}
                    onChange={(e) => {
                      const [p1, p2] = e.target.value.split("-").map(Number);
                      setSportsConfig({ ...sportsConfig, periods: [p1, p2] });
                    }}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    <option value="7-8">Periods 7 & 8 (Last 2 Periods)</option>
                    <option value="5-6">Periods 5 & 6 (Afternoon Block)</option>
                    <option value="3-4">Periods 3 & 4 (Mid-Day Block)</option>
                    <option value="1-2">Periods 1 & 2 (Morning Block)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Electives (EP) Priority */}
            <div style={{ padding: "0.85rem", borderRadius: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#5f7396", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={electiveConfig.enabled}
                    onChange={(e) => setElectiveConfig({ ...electiveConfig, enabled: e.target.checked })}
                    style={{ accentColor: "#5f7396", cursor: "pointer" }}
                  />
                  2. Electives (EP) Slot
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Dept-wide Sync</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Day Order</span>
                  <select
                    disabled={!electiveConfig.enabled}
                    value={electiveConfig.dayOrder}
                    onChange={(e) => setElectiveConfig({ ...electiveConfig, dayOrder: e.target.value })}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    {["I", "II", "III", "IV", "V"].map((d) => (
                      <option key={d} value={d}>Day Order {d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Time Slot</span>
                  <select
                    disabled={!electiveConfig.enabled}
                    value={`${electiveConfig.periods[0]}-${electiveConfig.periods[1]}`}
                    onChange={(e) => {
                      const [p1, p2] = e.target.value.split("-").map(Number);
                      setElectiveConfig({ ...electiveConfig, periods: [p1, p2] });
                    }}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    <option value="5-6">Periods 5 & 6 (2-P Block)</option>
                    <option value="3-4">Periods 3 & 4 (2-P Block)</option>
                    <option value="1-2">Periods 1 & 2 (2-P Block)</option>
                    <option value="7-8">Periods 7 & 8 (2-P Block)</option>
                  </select>
                </div>
              </div>

              {/* 3 Dedicated Elective Staff Selectors */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", marginTop: "0.35rem", paddingTop: "0.35rem", borderTop: "1px dashed var(--border-subtle)" }}>
                <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#5f7396" }}>
                  Elective Faculty (Up to 3 Staff Members):
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Staff 1</span>
                    <select
                      disabled={!electiveConfig.enabled}
                      value={electiveConfig.faculty1}
                      onChange={(e) => setElectiveConfig({ ...electiveConfig, faculty1: e.target.value })}
                      className="premium-input"
                      style={{ width: "100%", fontSize: "0.72rem", padding: "0.25rem 0.35rem" }}
                    >
                      <option value="">-- Faculty 1 --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Staff 2</span>
                    <select
                      disabled={!electiveConfig.enabled}
                      value={electiveConfig.faculty2}
                      onChange={(e) => setElectiveConfig({ ...electiveConfig, faculty2: e.target.value })}
                      className="premium-input"
                      style={{ width: "100%", fontSize: "0.72rem", padding: "0.25rem 0.35rem" }}
                    >
                      <option value="">-- Faculty 2 --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", display: "block" }}>Staff 3</span>
                    <select
                      disabled={!electiveConfig.enabled}
                      value={electiveConfig.faculty3}
                      onChange={(e) => setElectiveConfig({ ...electiveConfig, faculty3: e.target.value })}
                      className="premium-input"
                      style={{ width: "100%", fontSize: "0.72rem", padding: "0.25rem 0.35rem" }}
                    >
                      <option value="">-- Faculty 3 --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.name}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>



            {/* 3. Library Priority */}
            <div style={{ padding: "0.85rem", borderRadius: "10px", backgroundColor: "var(--bg-card)", border: "1px solid var(--border-subtle)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#fbbf24", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <input
                    type="checkbox"
                    checked={libraryConfig.enabled}
                    onChange={(e) => setLibraryConfig({ ...libraryConfig, enabled: e.target.checked })}
                    style={{ accentColor: "#fbbf24", cursor: "pointer" }}
                  />
                  3. Library (1 Period/Wk)
                </label>
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Single Period</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Day Order</span>
                  <select
                    disabled={!libraryConfig.enabled}
                    value={libraryConfig.dayOrder}
                    onChange={(e) => setLibraryConfig({ ...libraryConfig, dayOrder: e.target.value })}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    {["I", "II", "III", "IV", "V"].map((d) => (
                      <option key={d} value={d}>Day Order {d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "block" }}>Period</span>
                  <select
                    disabled={!libraryConfig.enabled}
                    value={libraryConfig.period}
                    onChange={(e) => setLibraryConfig({ ...libraryConfig, period: Number(e.target.value) })}
                    className="premium-input"
                    style={{ width: "100%", fontSize: "0.75rem", padding: "0.35rem" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                      <option key={p} value={p}>Period {p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action / Randomize Summary Bar */}
      <div
        className="premium-card"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          padding: "1rem 1.5rem",
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {semesterFilter === "ALL_CATALOG" ? "All Catalog Subjects" : `Subjects for ${computedClassId}`}
            </span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--text-main)" }}>
              {relevantSubjects.length}
            </div>
          </div>
          <div style={{ width: "1px", height: "30px", backgroundColor: "var(--border-subtle)" }} />
          <div>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Teachers Mapped</span>
            <div style={{ fontSize: "1.2rem", fontWeight: "700", color: assignedCount > 0 ? "#10b981" : "var(--text-muted)" }}>
              {assignedCount} / {relevantSubjects.length}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            onClick={handleAutoAssignTeachers}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Auto-Fill Teachers Evenly
          </button>

          <button
            onClick={handleSaveAllocationsToCatalog}
            disabled={savingAllocations || assignedCount === 0}
            title="Persist assigned faculty to Course Catalog & Faculty Profiles"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1.15rem",
              borderRadius: "8px",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              color: "#10b981",
              fontSize: "0.85rem",
              fontWeight: "700",
              cursor: savingAllocations || assignedCount === 0 ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <CheckCircle2 size={15} />
            {savingAllocations ? "Saving Allocations..." : `Save Allocations to Catalog (${assignedCount})`}
          </button>

          <button
            onClick={handleClearAssignments}
            style={{
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              color: "#ef4444",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Clear Mappings
          </button>

          <button
            onClick={handleExecuteRandomize}
            disabled={isRandomizing || relevantSubjects.length === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.65rem 1.35rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "var(--royal-blue)",
              color: "white",
              fontSize: "0.9rem",
              fontWeight: "700",
              cursor: isRandomizing || relevantSubjects.length === 0 ? "not-allowed" : "pointer",
              boxShadow: "0 4px 14px rgba(94, 39, 80, 0.35)",
              opacity: isRandomizing ? 0.7 : 1,
            }}
          >
            <Shuffle size={16} />
            {isRandomizing ? "Randomizing Timetable..." : `Run Randomize with Selected Teachers`}
          </button>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {statusMessage && (
        <div
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            border:
              statusMessage.type === "success"
                ? "1px solid #10b981"
                : statusMessage.type === "error"
                ? "1px solid #ef4444"
                : "1px solid var(--sky-blue)",
            backgroundColor:
              statusMessage.type === "success"
                ? "rgba(16, 185, 129, 0.12)"
                : statusMessage.type === "error"
                ? "rgba(239, 68, 68, 0.12)"
                : "rgba(94, 39, 80, 0.12)",
            color:
              statusMessage.type === "success"
                ? "#10b981"
                : statusMessage.type === "error"
                ? "#ef4444"
                : "var(--sky-blue)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            fontSize: "0.9rem",
            fontWeight: "600",
          }}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : statusMessage.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <HelpCircle size={18} />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Course & Teacher Assignment Table */}
      <div
        className="premium-card"
        style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BookOpen size={18} style={{ color: "var(--sky-blue)" }} />
            <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--text-main)" }}>
              {semesterFilter === "ALL_CATALOG"
                ? `All Course Catalog Subjects (${relevantSubjects.length})`
                : semesterFilter === "YEAR"
                ? `${selectedDept} Year ${selectedYear} (Sem ${computedSemester}-${computedSemester + 1}) Subjects (${relevantSubjects.length})`
                : `${selectedDept} Semester ${semesterFilter === "SEMESTER" ? computedSemester : semesterFilter} Subjects (${relevantSubjects.length})`}
            </span>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            {/* Catalog Scope / Semester Filter */}
            <select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--sky-blue)",
                fontWeight: "600",
                fontSize: "0.8rem",
              }}
              title="Filter subjects shown in allocation table"
            >
              <option value="SEMESTER">📌 Current Class ({selectedDept} Sem {computedSemester})</option>
              <option value="YEAR">🎯 Target Year {selectedYear} (Sem {computedSemester}-{computedSemester + 1})</option>
              <option value="ALL_CATALOG">📚 All Course Catalog Subjects ({catalogSubjects.length})</option>
              <option disabled>──────────</option>
              <option value="ODD_SEMS">🟣 Odd Semesters (Sem 1, 3, 5, 7)</option>
              <option value="EVEN_SEMS">🟢 Even Semesters (Sem 2, 4, 6, 8)</option>
              <option disabled>──────────</option>
              <option value="1">Semester 1 (Odd)</option>
              <option value="2">Semester 2 (Even)</option>
              <option value="3">Semester 3 (Odd)</option>
              <option value="4">Semester 4 (Even)</option>
              <option value="5">Semester 5 (Odd)</option>
              <option value="6">Semester 6 (Even)</option>
              <option value="7">Semester 7 (Odd)</option>
              <option value="8">Semester 8 (Even)</option>
            </select>

            {/* Search */}
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Search subject or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: "0.45rem 0.75rem 0.45rem 2rem",
                  borderRadius: "6px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "0.8rem",
                  width: "180px",
                }}
              />
              <Search size={13} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            </div>

            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{
                padding: "0.45rem 0.6rem",
                borderRadius: "6px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.8rem",
              }}
            >
              <option value="ALL">All Types</option>
              <option value="THEORY">Theory Only</option>
              <option value="LAB">Labs Only</option>
            </select>
            {/* Add Subject to Catalog Button */}
            <button
              onClick={handleOpenCreateModal}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.45rem 0.75rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "var(--sky-blue)",
                color: "#0f172a",
                fontSize: "0.8rem",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease",
              }}
            >
              <Plus size={14} /> Add Course
            </button>
          </div>
        </div>

        {loadingData ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            Loading course catalog and faculty directory...
          </div>
        ) : relevantSubjects.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
            <p style={{ margin: "0 0 0.5rem 0", fontWeight: "600", fontSize: "1rem" }}>
              No subjects found for {semesterFilter === "ALL_CATALOG" ? "Course Catalog" : `${selectedDept} Semester ${computedSemester}`}
            </p>
            <span style={{ fontSize: "0.85rem", display: "block", marginBottom: "1.25rem" }}>
              {catalogSubjects.length > 0 && semesterFilter !== "ALL_CATALOG"
                ? `There are ${catalogSubjects.length} subjects in the Course Catalog across all semesters/departments.`
                : "Add a new course directly below or from the Course Catalog."}
            </span>
            <div style={{ display: "inline-flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
              {catalogSubjects.length > 0 && semesterFilter !== "ALL_CATALOG" && (
                <button
                  onClick={() => setSemesterFilter("ALL_CATALOG")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--sky-blue)",
                    backgroundColor: "rgba(94, 39, 80, 0.12)",
                    color: "var(--sky-blue)",
                    fontWeight: "600",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <BookOpen size={15} /> Show Every Course Catalog Subject ({catalogSubjects.length})
                </button>
              )}
              <button
                onClick={handleOpenCreateModal}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "var(--royal-blue)",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                }}
              >
                <Plus size={15} /> Add Subject for Semester {computedSemester}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.875rem" }}>
              <thead style={{ backgroundColor: "var(--bg-card-header)", borderBottom: "1px solid var(--border-subtle)" }}>
                <tr>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "110px" }}>CODE</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600" }}>SUBJECT NAME</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "125px" }}>SEM (ODD/EVEN)</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "80px" }}>TYPE</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", minWidth: "220px" }}>ASSIGNED TEACHER / FACULTY</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "110px" }}>PERIODS / WK</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "130px" }}>BLOCK MODE</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "90px" }}>MTS NO</th>
                  <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: "600", width: "70px", textAlign: "center" }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {relevantSubjects.map((sub, idx) => {
                  const isLab = checkIfLab(sub);
                  const currentAssignment = assignments[sub.code] || {
                    facultyName: "",
                    vmsNo: "",
                    roomNo: isLab ? "CS-LAB-1" : "LH-201",
                  };
                  const currentRule = subjectRules[sub.code] || {
                    periodsPerWeek: isLab ? 2 : (sub.credits >= 4 ? 4 : (sub.credits || 3)),
                    isContinuous: isLab ? true : false,
                  };

                  const isHighlighted = highlightedCourseCode === sub.code;

                  return (
                    <tr
                      id={`allocation-row-${sub.code}`}
                      key={sub.code || sub.id}
                      style={{
                        borderBottom: isHighlighted ? "2px solid var(--sky-blue)" : "1px solid var(--border-subtle)",
                        backgroundColor: isHighlighted
                          ? "rgba(94, 39, 80, 0.14)"
                          : currentAssignment.facultyName
                          ? "rgba(16, 185, 129, 0.03)"
                          : "transparent",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem", fontWeight: "700", fontFamily: "monospace", color: isHighlighted ? "#8e4a7d" : "var(--sky-blue)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          {isHighlighted && <span style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "var(--sky-blue)" }} />}
                          {sub.code}
                        </div>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-main)", fontWeight: "500" }}>
                        <div>{sub.name}</div>
                        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                          Dept: <strong style={{ color: "var(--sky-blue)" }}>{sub.departmentCode || "ALL"}</strong> • Sem {sub.semester} • Credits: {sub.credits}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {(() => {
                          const semNum = Number(sub.semester) || 1;
                          const isOdd = semNum % 2 !== 0;
                          return (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.3rem",
                                padding: "0.2rem 0.55rem",
                                borderRadius: "6px",
                                fontSize: "0.72rem",
                                fontWeight: "700",
                                backgroundColor: isOdd ? "rgba(95, 115, 150, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                color: isOdd ? "#5f7396" : "#10b981",
                                border: isOdd ? "1px solid rgba(95, 115, 150, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                                whiteSpace: "nowrap"
                              }}
                            >
                              Sem {semNum} ({isOdd ? "Odd" : "Even"})
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            backgroundColor: isLab
                              ? "rgba(245, 158, 11, 0.15)"
                              : checkIfElective(sub)
                              ? "rgba(192, 132, 252, 0.15)"
                              : "rgba(94, 39, 80, 0.15)",
                            color: isLab ? "#f59e0b" : checkIfElective(sub) ? "#5f7396" : "var(--royal-blue)",
                          }}
                        >
                          {isLab ? "LAB (2 Staff)" : checkIfElective(sub) ? "ELECTIVE (3 Staff)" : "THEORY (1 Prof)"}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 1rem" }}>
                        {(() => {
                          const isElec = checkIfElective(sub);
                          const assignedList = (currentAssignment.facultyName || "").split(/[,/]+/).map(s => s.trim()).filter(Boolean);
                          const staff1 = assignedList[0] || "";
                          const staff2 = assignedList[1] || "";
                          const staff3 = assignedList[2] || "";

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                              {/* Staff 1 / Primary Handling Professor */}
                              <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                {(isLab || isElec) && (
                                  <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--text-muted)", minWidth: "48px" }}>
                                    Staff 1:
                                  </span>
                                )}
                                <select
                                  value={staff1}
                                  onChange={(e) => handleTeacherSelect(sub.code, e.target.value, 0)}
                                  className="premium-input"
                                  style={{ width: "100%", padding: "0.35rem 0.5rem", fontSize: "0.82rem" }}
                                >
                                  <option value="">
                                    {isLab
                                      ? "-- Select Primary Lab Faculty (Staff 1) --"
                                      : isElec
                                      ? "-- Select Elective Faculty 1 --"
                                      : "-- Choose Handling Professor (1 for this class) --"}
                                  </option>
                                  {teachers.map((t) => {
                                    const profileSubjects = [t.subject1, t.subject2, t.lab1, t.lab2, t.additional1, t.additional2]
                                      .filter(Boolean)
                                      .map(s => String(s).trim());

                                    const subNameLower = sub.name.toLowerCase();
                                    const subCodeLower = sub.code.toLowerCase();
                                    const hasProfileMatch = profileSubjects.some(ps => {
                                      const psl = ps.toLowerCase();
                                      return psl === subCodeLower || psl === subNameLower || subNameLower.includes(psl) || psl.includes(subNameLower);
                                    });

                                    const subjectBadge = profileSubjects.length > 0
                                      ? ` • Profile: ${profileSubjects.slice(0, 2).join(", ")}`
                                      : "";

                                    return (
                                      <option key={t.id} value={t.name}>
                                        {hasProfileMatch ? "★ " : ""}{t.name} {t.vmNo ? `(MTS: ${t.vmNo})` : ""} [{t.role}]{subjectBadge}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {/* Staff 2 (Available for Labs and Electives) */}
                              {(isLab || isElec) && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                  <span style={{ fontSize: "0.68rem", fontWeight: "700", color: isLab ? "#f59e0b" : "#5f7396", minWidth: "48px" }}>
                                    Staff 2:
                                  </span>
                                  <select
                                    value={staff2}
                                    onChange={(e) => handleTeacherSelect(sub.code, e.target.value, 1)}
                                    className="premium-input"
                                    style={{
                                      width: "100%",
                                      padding: "0.35rem 0.5rem",
                                      fontSize: "0.82rem",
                                      borderColor: staff2 ? (isLab ? "rgba(245, 158, 11, 0.4)" : "rgba(192, 132, 252, 0.4)") : "var(--border-subtle)"
                                    }}
                                  >
                                    <option value="">
                                      {isLab
                                        ? "-- Select 2nd Lab Faculty (Co-Incharge) --"
                                        : "-- Select Elective Faculty 2 --"}
                                    </option>
                                    {teachers.map((t) => (
                                      <option key={t.id} value={t.name}>
                                        {t.name} {t.vmNo ? `(MTS: ${t.vmNo})` : ""} [{t.role}]
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* Staff 3 (Available for Electives) */}
                              {isElec && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                                  <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "#5f7396", minWidth: "48px" }}>
                                    Staff 3:
                                  </span>
                                  <select
                                    value={staff3}
                                    onChange={(e) => handleTeacherSelect(sub.code, e.target.value, 2)}
                                    className="premium-input"
                                    style={{
                                      width: "100%",
                                      padding: "0.35rem 0.5rem",
                                      fontSize: "0.82rem",
                                      borderColor: staff3 ? "rgba(192, 132, 252, 0.4)" : "var(--border-subtle)"
                                    }}
                                  >
                                    <option value="">-- Select Elective Faculty 3 --</option>
                                    {teachers.map((t) => (
                                      <option key={t.id} value={t.name}>
                                        {t.name} {t.vmNo ? `(MTS: ${t.vmNo})` : ""} [{t.role}]
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      {/* Periods Per Week Selector */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <select
                          value={currentRule.periodsPerWeek}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setSubjectRules((prev) => ({
                              ...prev,
                              [sub.code]: {
                                ...(prev[sub.code] || currentRule),
                                periodsPerWeek: val,
                              },
                            }));
                          }}
                          className="premium-input"
                          style={{ padding: "0.35rem 0.5rem", fontSize: "0.82rem", width: "90px" }}
                        >
                          <option value={1}>1 P / wk</option>
                          <option value={2}>2 P / wk</option>
                          <option value={3}>3 P / wk</option>
                          <option value={4}>4 P / wk</option>
                          <option value={5}>5 P / wk</option>
                          <option value={6}>6 P / wk</option>
                        </select>
                      </td>
                      {/* Continuous 2-Period Block Option */}
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <label
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            cursor: "pointer",
                            fontSize: "0.78rem",
                            fontWeight: "600",
                            color: currentRule.isContinuous ? "var(--sky-blue)" : "var(--text-muted)",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={currentRule.isContinuous}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setSubjectRules((prev) => ({
                                ...prev,
                                [sub.code]: {
                                  ...(prev[sub.code] || currentRule),
                                  isContinuous: isChecked,
                                },
                              }));
                            }}
                            style={{ accentColor: "var(--sky-blue)", cursor: "pointer" }}
                          />
                          {currentRule.isContinuous ? "2-P Block ⚡" : "1-P Single"}
                        </label>
                      </td>
                      <td style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                        {currentAssignment.vmsNo || "—"}
                      </td>
                      <td style={{ padding: "0.75rem 1rem", textAlign: "center" }}>
                        <button
                          onClick={() => handleDeleteSubject(sub)}
                          disabled={deletingSubjectId === sub.id}
                          title={`Delete ${sub.code} from Course Catalog`}
                          style={{
                            padding: "0.35rem 0.55rem",
                            borderRadius: "6px",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                            backgroundColor: "rgba(239, 68, 68, 0.08)",
                            color: "#ef4444",
                            cursor: deletingSubjectId === sub.id ? "not-allowed" : "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={() => setShowAddSubjectModal(false)}
        >
          <div
            className="premium-card"
            style={{
              backgroundColor: "var(--bg-card)",
              borderRadius: "12px",
              border: "1px solid var(--border-subtle)",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: "1rem 1.25rem",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <BookOpen size={18} style={{ color: "var(--sky-blue)" }} />
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "var(--text-main)" }}>
                  Add Course to Catalog
                </h3>
              </div>
              <button
                onClick={() => setShowAddSubjectModal(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "4px",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.35rem" }}>
                  SUBJECT CODE *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 231CS321 or CS3301"
                  value={newSubCode}
                  onChange={(e) => setNewSubCode(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem", textTransform: "uppercase" }}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.35rem" }}>
                  SUBJECT NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Structures or Operating Systems"
                  value={newSubName}
                  onChange={(e) => setNewSubName(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.35rem" }}>
                    DEPARTMENT
                  </label>
                  <select
                    value={newSubDept}
                    onChange={(e) => setNewSubDept(e.target.value)}
                    className="premium-input"
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
                  >
                    {departments.length > 0 ? (
                      departments.map((d) => (
                        <option key={d.code} value={d.code}>
                          {d.code}
                        </option>
                      ))
                    ) : (
                      <option value="CSE">CSE</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.35rem" }}>
                    SEMESTER
                  </label>
                  <select
                    value={newSubSem}
                    onChange={(e) => setNewSubSem(e.target.value)}
                    className="premium-input"
                    style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Semester {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.35rem" }}>
                  CREDITS
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={newSubCredits}
                  onChange={(e) => setNewSubCredits(e.target.value)}
                  className="premium-input"
                  style={{ width: "100%", padding: "0.55rem 0.75rem", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddSubjectModal(false)}
                  style={{
                    padding: "0.55rem 1rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border-subtle)",
                    backgroundColor: "transparent",
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingSubject}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "var(--royal-blue)",
                    color: "#fff",
                    fontSize: "0.85rem",
                    fontWeight: "700",
                    cursor: creatingSubject ? "not-allowed" : "pointer",
                  }}
                >
                  {creatingSubject ? "Adding..." : "Add to Catalog"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
