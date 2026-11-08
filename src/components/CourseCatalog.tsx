"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Search,
  Plus,
  Filter,
  Edit2,
  Trash2,
  Users,
  Clock,
  Award,
  Layers,
  ChevronRight,
  X,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  LayoutGrid,
  Table as TableIcon,
  Building2,
  Calendar,
  MapPin,
  GraduationCap,
  UserCheck,
  UserPlus,
  ArrowRight
} from "lucide-react";

export interface ScheduleSlot {
  dayOrder: string;
  period: number;
  classId: string;
  facultyName: string;
  roomNo: string;
  timeRange: string;
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
  rooms?: string[];
  weeklyHours?: number;
  scheduleSlots?: ScheduleSlot[];
}

interface CourseCatalogProps {
  mode: "admin" | "hod";
  department?: string; // Initial department for HOD
  departments?: { code: string; name: string }[];
  onCourseUpdated?: () => void;
  onNavigateToAllocation?: (course: SubjectItem) => void;
}

export default function CourseCatalog({
  mode = "admin",
  department = "CSE",
  departments = [],
  onCourseUpdated,
  onNavigateToAllocation,
}: CourseCatalogProps) {
  const [courses, setCourses] = useState<SubjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>(mode === "hod" ? department : "ALL");
  const [selectedSemester, setSelectedSemester] = useState<string>("ALL");
  const [selectedAllocation, setSelectedAllocation] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED">("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"code" | "name" | "semester" | "credits">("code");

  // Selection & Modals
  const [selectedCourse, setSelectedCourse] = useState<SubjectItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<SubjectItem | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    credits: "3",
    semester: "5",
    departmentCode: mode === "hod" ? department : "CSE",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Available departments list (fallback if empty)
  const defaultDepts = departments.length > 0
    ? departments
    : [
        { code: "CSE", name: "Computer Science & Engineering" },
        { code: "ECE", name: "Electronics & Communication Engineering" },
        { code: "AIDS", name: "Artificial Intelligence & Data Science" },
        { code: "MECH", name: "Mechanical Engineering" },
        { code: "IT", name: "Information Technology" },
      ];

  // Fetch Courses
  const fetchCourses = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/admin/subjects");
      const data = await res.json();
      if (data.success && data.subjects) {
        setCourses(data.subjects);
        // If current selectedCourse is open, refresh its data too
        if (selectedCourse) {
          const updated = data.subjects.find((s: SubjectItem) => s.id === selectedCourse.id);
          if (updated) setSelectedCourse(updated);
        }
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Sync department prop change
  useEffect(() => {
    if (mode === "hod" && department) {
      setSelectedDept(department);
      setFormData(prev => ({ ...prev, departmentCode: department }));
    }
  }, [department, mode]);

  // Handle Copy Course Code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Open Edit Modal
  const handleOpenEdit = (course: SubjectItem) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      credits: course.credits.toString(),
      semester: course.semester.toString(),
      departmentCode: course.departmentCode,
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData({
      code: "",
      name: "",
      credits: "3",
      semester: "5",
      departmentCode: mode === "hod" ? department : (selectedDept !== "ALL" ? selectedDept : "CSE"),
    });
    setFormError("");
    setShowAddModal(true);
  };

  // Save (Create or Update)
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError("");

    try {
      if (editingCourse) {
        // PUT update
        const res = await fetch("/api/admin/subjects", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingCourse.id,
            code: formData.code,
            name: formData.name,
            credits: parseInt(formData.credits),
            semester: parseInt(formData.semester),
            departmentCode: formData.departmentCode,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error || "Failed to update course");
          setFormSubmitting(false);
          return;
        }
      } else {
        // POST create
        const res = await fetch("/api/admin/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: formData.code,
            name: formData.name,
            credits: parseInt(formData.credits),
            semester: parseInt(formData.semester),
            departmentCode: formData.departmentCode,
          }),
        });
        const data = await res.json();
        if (!data.success) {
          setFormError(data.error || "Failed to create course");
          setFormSubmitting(false);
          return;
        }
      }

      setShowAddModal(false);
      await fetchCourses();
      if (onCourseUpdated) onCourseUpdated();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to remove '${code}' from the catalog?`)) return;
    try {
      const res = await fetch(`/api/admin/subjects?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        if (selectedCourse?.id === id) setSelectedCourse(null);
        await fetchCourses();
        if (onCourseUpdated) onCourseUpdated();
      } else {
        alert("Failed to delete course: " + data.error);
      }
    } catch (err: any) {
      alert("Error deleting course: " + err.message);
    }
  };

  // Filtered & Sorted Courses
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => {
        // Department filter
        if (selectedDept !== "ALL" && c.departmentCode.toUpperCase() !== selectedDept.toUpperCase()) {
          return false;
        }

        // Semester filter
        if (selectedSemester !== "ALL" && c.semester.toString() !== selectedSemester) {
          return false;
        }

        // Allocation filter
        const hasFaculty = (c.facultiesHandling && c.facultiesHandling.length > 0);
        if (selectedAllocation === "ASSIGNED" && !hasFaculty) return false;
        if (selectedAllocation === "UNASSIGNED" && hasFaculty) return false;

        // Search text
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchesCode = c.code.toLowerCase().includes(q);
          const matchesName = c.name.toLowerCase().includes(q);
          const matchesDept = c.departmentCode.toLowerCase().includes(q);
          const matchesFaculty = c.facultiesHandling?.some(f => f.toLowerCase().includes(q));
          if (!matchesCode && !matchesName && !matchesDept && !matchesFaculty) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "code") return a.code.localeCompare(b.code);
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "semester") return a.semester - b.semester;
        if (sortBy === "credits") return b.credits - a.credits;
        return 0;
      });
  }, [courses, selectedDept, selectedSemester, selectedAllocation, searchTerm, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const scopeCourses = selectedDept === "ALL" 
      ? courses 
      : courses.filter(c => c.departmentCode.toUpperCase() === selectedDept.toUpperCase());
    
    const total = scopeCourses.length;
    const assigned = scopeCourses.filter(c => c.facultiesHandling && c.facultiesHandling.length > 0).length;
    const unassigned = total - assigned;
    const totalCredits = scopeCourses.reduce((acc, c) => acc + (c.credits || 0), 0);

    return { total, assigned, unassigned, totalCredits };
  }, [courses, selectedDept]);

  return (
    <div className="course-catalog-container">
      {/* HEADER SECTION */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        marginBottom: "1.75rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: mode === "hod"
                ? "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, var(--royal-blue) 0%, var(--sky-blue) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              boxShadow: "0 4px 12px rgba(56, 189, 248, 0.2)"
            }}>
              <BookOpen size={18} />
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              {mode === "hod" ? `${selectedDept} Course Catalog` : "Institutional Course Catalog"}
            </h2>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.3rem 0 0 0" }}>
            Comprehensive curriculum, faculty allocations, syllabus credits, and active section enrollment.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Refresh Button */}
          <button
            onClick={fetchCourses}
            disabled={refreshing}
            title="Refresh Catalog Data"
            style={{
              padding: "0.55rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <RefreshCw size={15} className={refreshing ? "spin-animation" : ""} />
            <span className="hide-on-mobile">{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>

          {/* View Mode Toggle */}
          <div style={{
            display: "flex",
            backgroundColor: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "8px",
            padding: "2px"
          }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "grid" ? "var(--bg-card)" : "transparent",
                color: viewMode === "grid" ? "var(--sky-blue)" : "var(--text-muted)",
                cursor: "pointer",
                boxShadow: viewMode === "grid" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
              }}
              title="Grid Cards View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              style={{
                padding: "0.45rem 0.65rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: viewMode === "table" ? "var(--bg-card)" : "transparent",
                color: viewMode === "table" ? "var(--sky-blue)" : "var(--text-muted)",
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 2px 4px rgba(0,0,0,0.1)" : "none"
              }}
              title="Table View"
            >
              <TableIcon size={16} />
            </button>
          </div>

          {/* Add Course Button */}
          <button
            onClick={handleOpenCreate}
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "8px",
              border: "none",
              background: mode === "hod"
                ? "linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, var(--royal-blue) 0%, var(--sky-blue) 100%)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "0.85rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(29, 78, 216, 0.25)"
            }}
          >
            <Plus size={16} /> Add Subject
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "1rem",
        marginBottom: "1.5rem"
      }}>
        {/* Total Courses */}
        <div className="student-card premium-card" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Total Courses</span>
            <div style={{ backgroundColor: "rgba(56, 189, 248, 0.12)", color: "var(--sky-blue)", padding: "0.4rem", borderRadius: "8px" }}>
              <BookOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--text-main)", marginTop: "0.4rem" }}>
            {stats.total}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {selectedDept === "ALL" ? "Across all departments" : `In ${selectedDept} Dept`}
          </span>
        </div>

        {/* Faculty Assigned */}
        <div className="student-card premium-card" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Staff Allocated</span>
            <div style={{ backgroundColor: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "0.4rem", borderRadius: "8px" }}>
              <CheckCircle2 size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "#10b981", marginTop: "0.4rem" }}>
            {stats.assigned}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {stats.total > 0 ? `${Math.round((stats.assigned / stats.total) * 100)}% allocated in timetable` : "No subjects"}
          </span>
        </div>

        {/* Needs Faculty */}
        <div className="student-card premium-card" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Pending Allocation</span>
            <div style={{ backgroundColor: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", padding: "0.4rem", borderRadius: "8px" }}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: "800", color: stats.unassigned > 0 ? "#f59e0b" : "var(--text-main)", marginTop: "0.4rem" }}>
            {stats.unassigned}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            {stats.unassigned > 0 ? "Awaiting staff assignment" : "All courses staffed"}
          </span>
        </div>

        {/* Curriculum Credits */}
        <div className="student-card premium-card" style={{ padding: "1.1rem 1.25rem", borderRadius: "12px", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: "600" }}>Curriculum Credits</span>
            <div style={{ backgroundColor: "rgba(168, 85, 247, 0.12)", color: "#a855f7", padding: "0.4rem", borderRadius: "8px" }}>
              <Award size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.65rem", fontWeight: "800", color: "#a855f7", marginTop: "0.4rem" }}>
            {stats.totalCredits}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Cumulative academic credits
          </span>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div style={{
        backgroundColor: "var(--bg-card)",
        padding: "1rem 1.25rem",
        borderRadius: "12px",
        border: "1px solid var(--border-subtle)",
        marginBottom: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.85rem"
      }}>
        {/* Top search & basic selects */}
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "center"
        }}>
          {/* Search Box */}
          <div style={{ position: "relative", flex: "1 1 280px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search by code, title, department, or faculty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "0.6rem 1rem 0.6rem 2.4rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem"
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer"
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Department Filter (Admin can switch all, HOD can switch or stay on dept) */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <Building2 size={16} style={{ color: "var(--text-muted)" }} />
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              style={{
                padding: "0.6rem 0.85rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                cursor: "pointer"
              }}
            >
              <option value="ALL">All Departments</option>
              {defaultDepts.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.code} - {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Allocation Status Filter */}
          <select
            value={selectedAllocation}
            onChange={(e) => setSelectedAllocation(e.target.value as any)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            <option value="ALL">All Allocations</option>
            <option value="ASSIGNED">Staff Assigned</option>
            <option value="UNASSIGNED">Unassigned Only</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "0.6rem 0.85rem",
              borderRadius: "8px",
              border: "1px solid var(--border-subtle)",
              backgroundColor: "var(--bg-input)",
              color: "var(--text-main)",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            <option value="code">Sort: Course Code</option>
            <option value="name">Sort: Course Name</option>
            <option value="semester">Sort: Semester</option>
            <option value="credits">Sort: Credits</option>
          </select>
        </div>

        {/* Semester Filter Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          overflowX: "auto",
          paddingBottom: "0.2rem"
        }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "600", marginRight: "0.3rem", whiteSpace: "nowrap" }}>
            Semester:
          </span>
          {["ALL", "1", "2", "3", "4", "5", "6", "7", "8"].map((sem) => (
            <button
              key={sem}
              onClick={() => setSelectedSemester(sem)}
              style={{
                padding: "0.3rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid",
                borderColor: selectedSemester === sem ? "var(--sky-blue)" : "var(--border-subtle)",
                backgroundColor: selectedSemester === sem ? "rgba(56, 189, 248, 0.15)" : "transparent",
                color: selectedSemester === sem ? "var(--sky-blue)" : "var(--text-muted)",
                fontSize: "0.75rem",
                fontWeight: selectedSemester === sem ? "700" : "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s"
              }}
            >
              {sem === "ALL" ? "All Semesters" : `Sem ${sem}`}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTS COUNT */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "1rem",
        fontSize: "0.85rem",
        color: "var(--text-muted)"
      }}>
        <div>
          Showing <strong>{filteredCourses.length}</strong> of <strong>{courses.length}</strong> courses
          {selectedDept !== "ALL" && ` in ${selectedDept}`}
          {selectedSemester !== "ALL" && ` (Semester ${selectedSemester})`}
        </div>
        {filteredCourses.length !== courses.length && (
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedDept(mode === "hod" ? department : "ALL");
              setSelectedSemester("ALL");
              setSelectedAllocation("ALL");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--sky-blue)",
              cursor: "pointer",
              fontSize: "0.8rem",
              textDecoration: "underline"
            }}
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* LOADING STATE */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "var(--text-muted)" }}>
          <RefreshCw size={32} className="spin-animation" style={{ margin: "0 auto 1rem auto", opacity: 0.5 }} />
          <div>Loading course catalog...</div>
        </div>
      ) : filteredCourses.length === 0 ? (
        /* EMPTY STATE */
        <div style={{
          textAlign: "center",
          padding: "4rem 2rem",
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px dashed var(--border-subtle)"
        }}>
          <BookOpen size={48} style={{ color: "var(--text-muted)", opacity: 0.4, margin: "0 auto 1rem auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: "600", margin: "0 0 0.5rem 0" }}>No courses found</h3>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", maxWidth: "400px", margin: "0 auto 1.5rem auto" }}>
            No subjects matched the current search query or filter selection. Try adjusting the semester, department, or search keywords.
          </p>
          <button
            onClick={handleOpenCreate}
            style={{
              padding: "0.6rem 1.2rem",
              borderRadius: "8px",
              border: "none",
              background: "var(--royal-blue)",
              color: "#fff",
              fontWeight: "600",
              fontSize: "0.85rem",
              cursor: "pointer"
            }}
          >
            + Add New Subject
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: "1.25rem"
        }}>
          {filteredCourses.map((c) => {
            const hasStaff = c.facultiesHandling && c.facultiesHandling.length > 0;
            const hasClasses = c.classesTaking && c.classesTaking.length > 0;

            return (
              <div
                key={c.id}
                className="student-card premium-card hover-lift"
                onClick={() => setSelectedCourse(c)}
                style={{
                  padding: "1.35rem",
                  borderRadius: "12px",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.2s ease",
                  position: "relative"
                }}
              >
                <div>
                  {/* Top Bar: Code, Dept, Copy */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(c.code);
                        }}
                        title="Click to copy code"
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: "800",
                          color: "var(--sky-blue)",
                          fontFamily: "monospace",
                          letterSpacing: "0.03em",
                          backgroundColor: "rgba(56, 189, 248, 0.1)",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          cursor: "copy"
                        }}
                      >
                        {c.code}
                        {copiedCode === c.code ? <Check size={12} color="#10b981" /> : <Copy size={12} style={{ opacity: 0.6 }} />}
                      </span>

                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "0.2rem 0.45rem",
                        borderRadius: "4px",
                        backgroundColor: "rgba(168, 85, 247, 0.12)",
                        color: "#a855f7"
                      }}>
                        {c.departmentCode}
                      </span>
                    </div>

                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      padding: "0.2rem 0.45rem",
                      borderRadius: "4px",
                      backgroundColor: "var(--bg-input)",
                      color: "var(--text-muted)"
                    }}>
                      Sem {c.semester}
                    </span>
                  </div>

                  {/* Course Title */}
                  <h3 style={{
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    margin: "0 0 0.85rem 0",
                    color: "var(--text-main)",
                    lineHeight: "1.35"
                  }}>
                    {c.name}
                  </h3>

                  {/* Badges: Credits & Weekly Hours */}
                  <div style={{ display: "flex", gap: "0.6rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <span style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      backgroundColor: "var(--bg-input)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "6px"
                    }}>
                      <Award size={13} color="#f59e0b" /> {c.credits} Credits
                    </span>

                    {c.weeklyHours !== undefined && c.weeklyHours > 0 && (
                      <span style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        backgroundColor: "var(--bg-input)",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "6px"
                      }}>
                        <Clock size={13} color="var(--sky-blue)" /> {c.weeklyHours} Hrs/Wk
                      </span>
                    )}
                  </div>

                  {/* Handling Staff Preview */}
                  <div style={{
                    backgroundColor: "var(--bg-input)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                    fontSize: "0.8rem"
                  }}>
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: hasStaff ? "0.4rem" : "0"
                    }}>
                      <span style={{ color: "var(--text-muted)", fontWeight: "600", fontSize: "0.75rem" }}>
                        Handling Faculty:
                      </span>
                      {hasStaff ? (
                        <span style={{ color: "#10b981", fontSize: "0.7rem", fontWeight: "700" }}>
                          ✓ Allocated
                        </span>
                      ) : (
                        <span style={{ color: "#f59e0b", fontSize: "0.7rem", fontWeight: "700" }}>
                          ⚠️ Unassigned
                        </span>
                      )}
                    </div>

                    {hasStaff ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        {c.facultiesHandling!.map((fac, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: "var(--bg-card)",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.75rem",
                              fontWeight: "600",
                              color: "var(--text-main)",
                              border: "1px solid var(--border-subtle)"
                            }}
                          >
                            {fac}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "var(--text-muted)", fontSize: "0.75rem", fontStyle: "italic" }}>
                        No timetable slots mapped yet
                      </div>
                    )}
                  </div>

                  {/* Classes Taking Preview */}
                  {hasClasses && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Sections:</span>
                      {c.classesTaking!.map((cls, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: "700",
                            padding: "0.1rem 0.35rem",
                            borderRadius: "4px",
                            backgroundColor: "rgba(168, 85, 247, 0.1)",
                            color: "#a855f7"
                          }}
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "0.75rem",
                  borderTop: "1px solid var(--border-subtle)",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCourse(c);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        fontWeight: "600",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      <Users size={14} /> Details <ChevronRight size={13} />
                    </button>

                    {onNavigateToAllocation && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToAllocation(c);
                        }}
                        title={`Connect & allocate faculty for ${c.code}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "0.25rem 0.55rem",
                          borderRadius: "6px",
                          border: hasStaff ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(56, 189, 248, 0.4)",
                          backgroundColor: hasStaff ? "rgba(16, 185, 129, 0.08)" : "rgba(56, 189, 248, 0.12)",
                          color: hasStaff ? "#10b981" : "var(--sky-blue)",
                          fontSize: "0.75rem",
                          fontWeight: "700",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {hasStaff ? <UserCheck size={13} /> : <UserPlus size={13} />}
                        {hasStaff ? "Manage Staff" : "Allocate Teacher"}
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(c);
                      }}
                      title="Edit Course"
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border-subtle)",
                        backgroundColor: "var(--bg-input)",
                        color: "var(--text-main)",
                        cursor: "pointer"
                      }}
                    >
                      <Edit2 size={13} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(c.id, c.code);
                      }}
                      title="Delete Course"
                      style={{
                        padding: "0.35rem 0.5rem",
                        borderRadius: "6px",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        cursor: "pointer"
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="responsive-table-wrapper" style={{
          backgroundColor: "var(--bg-card)",
          borderRadius: "12px",
          border: "1px solid var(--border-subtle)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{
                backgroundColor: "var(--bg-card-header)",
                borderBottom: "1px solid var(--border-subtle)",
                color: "var(--text-muted)",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.04em"
              }}>
                <th style={{ padding: "0.85rem 1rem" }}>Code</th>
                <th style={{ padding: "0.85rem 1rem" }}>Course Title</th>
                <th style={{ padding: "0.85rem 1rem" }}>Dept</th>
                <th style={{ padding: "0.85rem 1rem" }}>Semester</th>
                <th style={{ padding: "0.85rem 1rem" }}>Credits</th>
                <th style={{ padding: "0.85rem 1rem" }}>Handling Faculty</th>
                <th style={{ padding: "0.85rem 1rem" }}>Sections</th>
                <th style={{ padding: "0.85rem 1rem" }}>Weekly Slots</th>
                <th style={{ padding: "0.85rem 1rem", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((c) => {
                const hasStaff = c.facultiesHandling && c.facultiesHandling.length > 0;
                return (
                  <tr
                    key={c.id}
                    onClick={() => setSelectedCourse(c)}
                    style={{
                      borderBottom: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                      backgroundColor: selectedCourse?.id === c.id ? "rgba(56, 189, 248, 0.08)" : "transparent"
                    }}
                    className="hover-row"
                  >
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "700", color: "var(--sky-blue)", fontFamily: "monospace" }}>
                      {c.code}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "600", color: "var(--text-main)" }}>
                      {c.name}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      <span style={{
                        padding: "0.15rem 0.45rem",
                        borderRadius: "4px",
                        backgroundColor: "rgba(168, 85, 247, 0.12)",
                        color: "#a855f7",
                        fontSize: "0.75rem",
                        fontWeight: "700"
                      }}>
                        {c.departmentCode}
                      </span>
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      Sem {c.semester}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", fontWeight: "600" }}>
                      {c.credits}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {hasStaff ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                          {c.facultiesHandling!.map((fac, idx) => (
                            <span key={idx} style={{
                              padding: "0.1rem 0.4rem",
                              borderRadius: "4px",
                              backgroundColor: "var(--bg-input)",
                              fontSize: "0.75rem"
                            }}>
                              {fac}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "#f59e0b", fontSize: "0.75rem", fontWeight: "600" }}>
                          ⚠️ Unassigned
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {c.classesTaking && c.classesTaking.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.25rem" }}>
                          {c.classesTaking.map((cls, idx) => (
                            <span key={idx} style={{
                              padding: "0.1rem 0.35rem",
                              borderRadius: "4px",
                              backgroundColor: "rgba(56, 189, 248, 0.1)",
                              color: "var(--sky-blue)",
                              fontSize: "0.75rem",
                              fontWeight: "600"
                            }}>
                              {cls}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem" }}>
                      {c.weeklyHours !== undefined && c.weeklyHours > 0 ? (
                        <span style={{ fontWeight: "600", color: "var(--sky-blue)" }}>{c.weeklyHours} hrs</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "0.85rem 1rem", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                        {onNavigateToAllocation && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onNavigateToAllocation(c);
                            }}
                            title={`Allocate faculty for ${c.code}`}
                            style={{
                              padding: "0.25rem 0.55rem",
                              borderRadius: "4px",
                              backgroundColor: hasStaff ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
                              color: hasStaff ? "#10b981" : "var(--sky-blue)",
                              border: "none",
                              fontSize: "0.75rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem"
                            }}
                          >
                            {hasStaff ? <UserCheck size={12} /> : <UserPlus size={12} />}
                            {hasStaff ? "Allocated" : "Allocate"}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCourse(c);
                          }}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-input)",
                            color: "var(--text-main)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Details
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(c);
                          }}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "4px",
                            backgroundColor: "var(--bg-input)",
                            color: "var(--text-main)",
                            border: "1px solid var(--border-subtle)",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCourse(c.id, c.code);
                          }}
                          style={{
                            padding: "0.25rem 0.55rem",
                            borderRadius: "4px",
                            backgroundColor: "rgba(239, 68, 68, 0.1)",
                            color: "#ef4444",
                            border: "none",
                            fontSize: "0.75rem",
                            cursor: "pointer"
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* DETAIL / ALLOCATION SLIDE-OVER DRAWER */}
      {selectedCourse && (
        <div className="admin-drawer-container" onClick={() => setSelectedCourse(null)}>
          <aside
            onClick={(e) => e.stopPropagation()}
            className="admin-drawer"
            style={{ width: "460px", maxWidth: "90vw" }}
          >
            <div>
              {/* Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: "1rem",
                borderBottom: "1px solid var(--border-subtle)",
                marginBottom: "1.5rem"
              }}>
                <div>
                  <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--sky-blue)", letterSpacing: "0.05em" }}>
                    COURSE & FACULTY ALLOCATION
                  </span>
                  <h2 style={{ fontSize: "1.3rem", fontWeight: "700", margin: "0.2rem 0 0 0" }}>
                    {selectedCourse.code}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    fontSize: "1.2rem",
                    cursor: "pointer"
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Course Meta Card */}
              <div style={{
                backgroundColor: "var(--bg-page)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-subtle)",
                marginBottom: "1.5rem"
              }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)", marginBottom: "0.75rem" }}>
                  {selectedCourse.name}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", fontSize: "0.85rem" }}>
                  <div>🏛️ Dept: <strong>{selectedCourse.departmentCode}</strong></div>
                  <div>🎓 Semester: <strong>Sem {selectedCourse.semester}</strong></div>
                  <div>⭐ Credits: <strong>{selectedCourse.credits} Credits</strong></div>
                  <div>⏰ Weekly Hours: <strong>{selectedCourse.weeklyHours || 0} hrs</strong></div>
                </div>
                {selectedCourse.rooms && selectedCourse.rooms.length > 0 && (
                  <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-subtle)", fontSize: "0.85rem" }}>
                    <MapPin size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px", color: "var(--sky-blue)" }} />
                    Rooms: <strong>{selectedCourse.rooms.join(", ")}</strong>
                  </div>
                )}
              </div>

              {/* Assigned Faculty Section */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--sky-blue)", letterSpacing: "0.05em", marginBottom: "0.85rem", textTransform: "uppercase" }}>
                  👨‍🏫 Assigned Teaching Faculty ({selectedCourse.facultiesHandling?.length || 0})
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {selectedCourse.facultiesHandling && selectedCourse.facultiesHandling.length > 0 ? (
                    selectedCourse.facultiesHandling.map((staff, idx) => (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: "var(--bg-page)",
                          padding: "0.85rem 1rem",
                          borderRadius: "10px",
                          border: "1px solid var(--border-subtle)",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem"
                        }}
                      >
                        <div style={{
                          width: "38px",
                          height: "38px",
                          borderRadius: "8px",
                          background: idx % 2 === 0
                            ? "linear-gradient(135deg, #10b981 0%, #047857 100%)"
                            : "linear-gradient(135deg, var(--royal-blue) 0%, var(--sky-blue) 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: "700",
                          fontSize: "0.95rem"
                        }}>
                          {staff.replace(/^(Dr|Mr|Ms|Mrs)\.?\s*/i, "").charAt(0)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.9rem" }}>{staff}</strong>
                            <span style={{
                              fontSize: "0.7rem",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              backgroundColor: "rgba(16, 185, 129, 0.15)",
                              color: "#10b981",
                              fontWeight: "700"
                            }}>
                              Active Teacher
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "2px" }}>
                            Department of {selectedCourse.departmentCode}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{
                      padding: "1rem",
                      backgroundColor: "rgba(245, 158, 11, 0.08)",
                      border: "1px solid rgba(245, 158, 11, 0.2)",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      color: "#f59e0b"
                    }}>
                      ⚠️ No faculty currently mapped to this subject in the timetable.
                    </div>
                  )}
                </div>
              </div>

              {/* Classes Taking Course */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "#a855f7", letterSpacing: "0.05em", marginBottom: "0.85rem", textTransform: "uppercase" }}>
                  👥 Enrolled Sections ({selectedCourse.classesTaking?.length || 0})
                </h4>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {selectedCourse.classesTaking && selectedCourse.classesTaking.length > 0 ? (
                    selectedCourse.classesTaking.map((cls, idx) => (
                      <span
                        key={idx}
                        style={{
                          padding: "0.4rem 0.8rem",
                          backgroundColor: "rgba(168, 85, 247, 0.12)",
                          color: "#a855f7",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "700"
                        }}
                      >
                        {cls}
                      </span>
                    ))
                  ) : (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      No class sections assigned yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Schedule Slots Table */}
              {selectedCourse.scheduleSlots && selectedCourse.scheduleSlots.length > 0 && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--text-muted)", letterSpacing: "0.05em", marginBottom: "0.85rem", textTransform: "uppercase" }}>
                    📅 Weekly Timetable Slots
                  </h4>
                  <div style={{
                    maxHeight: "200px",
                    overflowY: "auto",
                    borderRadius: "8px",
                    border: "1px solid var(--border-subtle)"
                  }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.75rem", textAlign: "left" }}>
                      <thead>
                        <tr style={{ backgroundColor: "var(--bg-card-header)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                          <th style={{ padding: "0.5rem 0.6rem" }}>Day</th>
                          <th style={{ padding: "0.5rem 0.6rem" }}>Period</th>
                          <th style={{ padding: "0.5rem 0.6rem" }}>Class</th>
                          <th style={{ padding: "0.5rem 0.6rem" }}>Faculty</th>
                          <th style={{ padding: "0.5rem 0.6rem" }}>Room</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedCourse.scheduleSlots.map((slot, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                            <td style={{ padding: "0.45rem 0.6rem", fontWeight: "700" }}>Day {slot.dayOrder}</td>
                            <td style={{ padding: "0.45rem 0.6rem" }}>P{slot.period}</td>
                            <td style={{ padding: "0.45rem 0.6rem", color: "var(--sky-blue)", fontWeight: "600" }}>{slot.classId}</td>
                            <td style={{ padding: "0.45rem 0.6rem" }}>{slot.facultyName}</td>
                            <td style={{ padding: "0.45rem 0.6rem" }}>{slot.roomNo}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions at bottom */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              paddingTop: "1rem",
              borderTop: "1px solid var(--border-subtle)",
              marginTop: "auto"
            }}>
              {onNavigateToAllocation && (
                <button
                  onClick={() => {
                    const c = selectedCourse;
                    setSelectedCourse(null);
                    onNavigateToAllocation(c);
                  }}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    backgroundColor: "var(--royal-blue)",
                    color: "white",
                    border: "none",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    boxShadow: "0 4px 12px rgba(29, 78, 216, 0.3)"
                  }}
                >
                  <UserPlus size={16} /> Connect & Allocate Teachers for {selectedCourse.code}
                  <ArrowRight size={15} />
                </button>
              )}

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={() => handleOpenEdit(selectedCourse)}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--bg-input)",
                    color: "var(--text-main)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.65rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Edit Subject Details
                </button>
                <button
                  onClick={() => setSelectedCourse(null)}
                  style={{
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border-subtle)",
                    padding: "0.65rem 1.25rem",
                    borderRadius: "8px",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* CREATE / EDIT SUBJECT MODAL */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: "480px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
                {editingCourse ? "Edit Course Details" : "Add New Subject to Catalog"}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "1.2rem", cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div style={{
                padding: "0.75rem",
                borderRadius: "8px",
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#ef4444",
                fontSize: "0.85rem",
                marginBottom: "1rem"
              }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCourse} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Subject Code */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Course Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. CS8591 or 21CS501"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  className="premium-input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Subject Title */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Course Title / Subject Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Networks & Protocols"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="premium-input"
                  style={{ width: "100%" }}
                />
              </div>

              {/* Department */}
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  Department *
                </label>
                <select
                  value={formData.departmentCode}
                  onChange={(e) => setFormData({ ...formData, departmentCode: e.target.value })}
                  required
                  className="premium-input"
                  style={{ width: "100%" }}
                  disabled={mode === "hod"} // In HOD mode, locked to HOD's dept
                >
                  {defaultDepts.map((d) => (
                    <option key={d.code} value={d.code}>
                      {d.code} - {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Credits and Semester */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Credits (1 - 6) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    placeholder="Credits"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    required
                    className="premium-input"
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Semester (1 - 8) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    placeholder="Semester"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                    required
                    className="premium-input"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  style={{
                    flex: 1,
                    backgroundColor: "var(--royal-blue)",
                    color: "white",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "600",
                    cursor: "pointer",
                    fontSize: "0.85rem"
                  }}
                >
                  {formSubmitting ? "Saving..." : (editingCourse ? "Update Subject" : "Save to Catalog")}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.1)",
                    color: "var(--text-main)",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
