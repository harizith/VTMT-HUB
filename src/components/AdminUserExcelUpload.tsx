"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  UploadCloud, 
  UserPlus, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Trash2,
  Users,
  ShieldCheck,
  GraduationCap,
  Briefcase,
  Layers,
  ArrowRight
} from "lucide-react";

export type UserOnboardMode = "STUDENT" | "FACULTY" | "HOD" | "ALL";

interface UserPreviewRow {
  name: string;
  email: string;
  role: "STUDENT" | "FACULTY" | "HOD" | "ADMIN";
  vmNo?: string;
  password?: string;
  department?: string;
  rollNumber?: string;
  year?: string;
  section?: string;
  semester?: number;
  batch?: string;
  designation?: string;
  subject1?: string;
  subject2?: string;
  lab1?: string;
  additional1?: string;
  additional2?: string;
}

export default function AdminUserExcelUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  // Mode selection state
  const [selectedMode, setSelectedMode] = useState<UserOnboardMode>("STUDENT");

  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<UserPreviewRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ 
    success: boolean; 
    created?: number; 
    updated?: number; 
    message?: string 
  } | null>(null);
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mode Specific Column Configurations
  const MODE_COLUMNS: Record<UserOnboardMode, {
    title: string;
    description: string;
    badgeColor: string;
    badgeBg: string;
    icon: any;
    sampleRows: any[];
    columnsGuide: { col: string; req: string; sample: string; desc: string }[];
  }> = {
    STUDENT: {
      title: "Student Onboarding Mode",
      description: "Batch onboarding for students with Roll Number, Semester, Section, Year, and Department.",
      badgeColor: "#38bdf8",
      badgeBg: "rgba(56, 189, 248, 0.15)",
      icon: GraduationCap,
      sampleRows: [
        {
          "Full Name": "Aarav Sharma",
          "Email Address": "aarav.cse@veltech.edu.in",
          "VM No": "17433",
          "Roll Number": "23CS101",
          "Department": "CSE",
          "Year": "II",
          "Section": "A",
          "Semester": 3,
          "Batch": "2023-2027",
          "Password": "Welcome@123"
        },
        {
          "Full Name": "Sneha Patel",
          "Email Address": "sneha.cse@veltech.edu.in",
          "VM No": "17434",
          "Roll Number": "23CS102",
          "Department": "CSE",
          "Year": "II",
          "Section": "A",
          "Semester": 3,
          "Batch": "2023-2027",
          "Password": "Welcome@123"
        }
      ],
      columnsGuide: [
        { col: "Full Name", req: "Required", sample: "Aarav Sharma", desc: "User.name" },
        { col: "Email Address", req: "Required", sample: "aarav@veltech.edu.in", desc: "User.email (Primary Login Key)" },
        { col: "VM No", req: "Required", sample: "17433", desc: "User.vmNo & Profile Key" },
        { col: "Roll Number", req: "Optional", sample: "23CS101", desc: "StudentProfile.rollNumber (defaults to VM No)" },
        { col: "Department", req: "Optional", sample: "CSE, ECE, AIDS, MECH", desc: "StudentProfile.department" },
        { col: "Semester", req: "Optional", sample: "1 to 8", desc: "StudentProfile.semester" },
        { col: "Year", req: "Optional", sample: "I, II, III, IV", desc: "StudentProfile.year" },
        { col: "Section", req: "Optional", sample: "A, B, C", desc: "StudentProfile.section" },
        { col: "Batch", req: "Optional", sample: "2023-2027", desc: "StudentProfile.batch" },
        { col: "Password", req: "Optional", sample: "Welcome@123", desc: "Encrypted password (default Welcome@123)" }
      ]
    },

    FACULTY: {
      title: "Faculty & Staff Onboarding Mode",
      description: "Batch onboarding for teaching staff with VMS Staff ID, Designation, and Department.",
      badgeColor: "#10b981",
      badgeBg: "rgba(16, 185, 129, 0.15)",
      icon: Briefcase,
      sampleRows: [
        {
          "Full Name": "Dr. E. Mercy Beulah",
          "Email Address": "mercybeulah@veltech.edu.in",
          "MTS No": "2103",
          "Department": "CSE",
          "Designation": "Assistant Professor",
          "Subject1": "Data Structures",
          "Subject2": "Operating Systems",
          "Lab1": "Data Structures Lab",
          "Additional1": "",
          "Additional2": "",
          "Password": "Welcome@123"
        },
        {
          "Full Name": "Mr. P. Sathish Kumar",
          "Email Address": "sathishkumar@veltech.edu.in",
          "MTS No": "2088",
          "Department": "CSE",
          "Designation": "Assistant Professor",
          "Subject1": "",
          "Subject2": "",
          "Lab1": "",
          "Additional1": "",
          "Additional2": "",
          "Password": "Welcome@123"
        }
      ],
      columnsGuide: [
        { col: "Full Name", req: "Required", sample: "Dr. E. Mercy Beulah", desc: "User.name" },
        { col: "Email Address", req: "Required", sample: "mercy@veltech.edu.in", desc: "User.email (Primary Login Key)" },
        { col: "MTS No", req: "Required for teacher assignments", sample: "2103", desc: "User.vmNo & FacultyProfile.vmNo" },
        { col: "Department", req: "Optional", sample: "CSE, ECE, AIDS, MECH", desc: "FacultyProfile.department" },
        { col: "Designation", req: "Optional", sample: "Assistant Professor, Professor", desc: "FacultyProfile.designation" },
        { col: "Subject1", req: "Optional", sample: "Data Structures", desc: "FacultyProfile.subject1 (read-only for faculty)" },
        { col: "Subject2", req: "Optional", sample: "Operating Systems", desc: "FacultyProfile.subject2 (read-only for faculty)" },
        { col: "Lab1", req: "Optional", sample: "Data Structures Lab", desc: "FacultyProfile.lab1 (read-only for faculty)" },
        { col: "Additional1", req: "Optional", sample: "Project Guidance", desc: "FacultyProfile.additional1 (read-only for faculty)" },
        { col: "Additional2", req: "Optional", sample: "Elective", desc: "FacultyProfile.additional2 (read-only for faculty)" },
        { col: "Password", req: "Optional", sample: "Welcome@123", desc: "Encrypted password (default Welcome@123)" }
      ]
    },

    HOD: {
      title: "Head of Department (HOD) Mode",
      description: "Onboarding department heads with executive management authority over departments.",
      badgeColor: "#a855f7",
      badgeBg: "rgba(168, 85, 247, 0.15)",
      icon: ShieldCheck,
      sampleRows: [
        {
          "Full Name": "Dr. R. Saravanan",
          "Email Address": "saravanan.r@veltech.edu.in",
          "MTS No": "1944",
          "Department": "CSE",
          "Designation": "Professor & Head",
          "Password": "Welcome@123"
        }
      ],
      columnsGuide: [
        { col: "Full Name", req: "Required", sample: "Dr. R. Saravanan", desc: "User.name" },
        { col: "Email Address", req: "Required", sample: "saravanan@veltech.edu.in", desc: "User.email (Primary Login Key)" },
        { col: "MTS No", req: "Required", sample: "1944", desc: "User.vmNo & HodProfile.vmNo" },
        { col: "Department", req: "Optional", sample: "CSE", desc: "HodProfile.department jurisdiction" },
        { col: "Designation", req: "Optional", sample: "Professor & Head", desc: "HodProfile.designation" },
        { col: "Password", req: "Optional", sample: "Welcome@123", desc: "Encrypted password (default Welcome@123)" }
      ]
    },

    ALL: {
      title: "Mixed Multi-Role Mode",
      description: "Omni-role template containing a 'User Role' column (STUDENT, FACULTY, HOD, ADMIN).",
      badgeColor: "#f59e0b",
      badgeBg: "rgba(245, 158, 11, 0.15)",
      icon: Users,
      sampleRows: [
        {
          "Full Name": "Aarav Sharma",
          "Email Address": "aarav.cse@veltech.edu.in",
          "User Role": "STUDENT",
          "VM No": "17433",
          "Department": "CSE",
          "Semester": 3,
          "Section": "A",
          "Subject1": "",
          "Subject2": "",
          "Lab1": "",
          "Additional1": "",
          "Additional2": "",
          "Designation": "",
          "Password": "Welcome@123"
        },
        {
          "Full Name": "Dr. R. Saravanan",
          "Email Address": "saravanan.r@veltech.edu.in",
          "User Role": "HOD",
          "VM No": "1944",
          "Department": "CSE",
          "Semester": "",
          "Section": "",
          "Designation": "Professor & Head",
          "Password": "Welcome@123"
        }
      ],
      columnsGuide: [
        { col: "Full Name", req: "Required", sample: "Aarav Sharma", desc: "User.name" },
        { col: "Email Address", req: "Required", sample: "aarav@veltech.edu.in", desc: "User.email" },
        { col: "User Role", req: "Required", sample: "STUDENT, FACULTY, HOD, ADMIN", desc: "User.role selector" },
        { col: "VM No", req: "Optional", sample: "17433, 1944", desc: "User.vmNo" },
        { col: "Department", req: "Optional", sample: "CSE, ECE, AIDS", desc: "Linked Department" },
        { col: "Semester", req: "Optional", sample: "3", desc: "StudentProfile.semester" },
        { col: "Section", req: "Optional", sample: "A", desc: "StudentProfile.section" },
        { col: "Designation", req: "Optional", sample: "Assistant Professor", desc: "Staff designation" },
        { col: "Subject1", req: "Optional", sample: "Data Structures", desc: "Faculty teaching assignment" },
        { col: "Subject2", req: "Optional", sample: "Operating Systems", desc: "Faculty teaching assignment" },
        { col: "Lab1", req: "Optional", sample: "Data Structures Lab", desc: "Faculty teaching assignment" },
        { col: "Additional1", req: "Optional", sample: "", desc: "Faculty teaching assignment" },
        { col: "Additional2", req: "Optional", sample: "", desc: "Faculty teaching assignment" },
        { col: "Password", req: "Optional", sample: "Welcome@123", desc: "Default Welcome@123" }
      ]
    }
  };

  const currentModeConfig = MODE_COLUMNS[selectedMode];

  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    const ws = XLSX.utils.json_to_sheet(currentModeConfig.sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${selectedMode}_Template`);
    const fileName = `${selectedMode}_Onboarding_Template.${format}`;
    if (format === "xlsx") {
      XLSX.writeFile(wb, fileName);
    } else {
      XLSX.writeFile(wb, fileName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setParsingError(null);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

        if (!rawJson || rawJson.length === 0) {
          setParsingError("Uploaded sheet contains no data rows.");
          setParsedRows([]);
          return;
        }

        const normalizeHeader = (value: unknown) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const columnAliases: Record<string, string[]> = {
          subject1: ["subject1", "subjectone", "sub1", "subone", "subject 1", "sub 1"],
          subject2: ["subject2", "subjecttwo", "sub2", "subtwo", "subject 2", "sub 2"],
          lab1: ["lab1", "laboratory1", "labone", "lab 1", "laboratory 1"],
          additional1: ["additional1", "add1", "addone", "additional 1", "add 1"],
          additional2: ["additional2", "add2", "addtwo", "additional 2", "add 2"],
        };
        const sourceHeaders = Object.keys(rawJson[0] || {});
        const subjectColumnsPresent = Object.fromEntries(
          Object.entries(columnAliases).map(([field, aliases]) => [
            field,
            sourceHeaders.some((header) => aliases.some(a => normalizeHeader(a) === normalizeHeader(header))),
          ])
        );
        const getCell = (row: any, aliases: string[]) => {
          const wanted = new Set(aliases.map(normalizeHeader));
          const key = Object.keys(row).find((header) => wanted.has(normalizeHeader(header)));
          return key === undefined ? undefined : row[key];
        };
        const hasHeader = (...aliases: string[]) => {
          const wanted = new Set(aliases.map(normalizeHeader));
          return sourceHeaders.some((header) => wanted.has(normalizeHeader(header)));
        };

        const mapped: UserPreviewRow[] = rawJson.map((r: any) => {
          // Normalize role based on selectedMode or explicit column
          let role: "STUDENT" | "FACULTY" | "HOD" | "ADMIN" = selectedMode === "ALL" ? "STUDENT" : selectedMode;
          const userRole = getCell(r, ["User Role", "Role", "User Mode"]);
          if (userRole) {
            const rawRole = userRole.toString().toUpperCase();
            if (rawRole.includes("HOD") || rawRole.includes("HEAD")) role = "HOD";
            else if (rawRole.includes("FACULTY") || rawRole.includes("TEACHER") || rawRole.includes("PROF")) role = "FACULTY";
            else if (rawRole.includes("ADMIN")) role = "ADMIN";
            else role = "STUDENT";
          }

          const rawEmail = getCell(r, ["Email Address", "Email", "Email ID"]);
          const email = String(rawEmail ?? "").toLowerCase().trim();
          const name = String(getCell(r, ["Full Name", "Name", "User Name"]) ?? "").trim();
          const vmNo = String(getCell(r, ["VM No", "VMNo", "VMS No", "MTS No", "MTS / VMS No"]) ?? "").trim();
          const rollNumber = String(getCell(r, ["Roll Number", "Roll No"]) ?? "").trim();
          const department = String(getCell(r, ["Department", "Dept"]) ?? "").trim().toUpperCase();
          const password = String(getCell(r, ["Password", "Pass"]) ?? "").trim();
          const year = String(getCell(r, ["Year"]) ?? "").trim();
          const section = String(getCell(r, ["Section", "Sec"]) ?? "").trim();
          const rawSemester = String(getCell(r, ["Semester"]) ?? "").trim();
          const parsedSemester = rawSemester ? Number.parseInt(rawSemester, 10) : undefined;
          const semester = parsedSemester && Number.isFinite(parsedSemester) ? parsedSemester : undefined;
          const batch = String(getCell(r, ["Batch"]) ?? "").trim();
          const designation = String(getCell(r, ["Designation"]) ?? "").trim();

          const preview: UserPreviewRow = { name, email, role };
          if (hasHeader("VM No", "VMNo", "VMS No", "MTS No", "MTS / VMS No")) preview.vmNo = vmNo;
          if (hasHeader("Roll Number", "Roll No")) preview.rollNumber = rollNumber;
          if (hasHeader("Department", "Dept")) preview.department = department;
          if (hasHeader("Password", "Pass") && password) preview.password = password;
          if (hasHeader("Year")) preview.year = year;
          if (hasHeader("Section", "Sec")) preview.section = section;
          if (hasHeader("Semester")) preview.semester = semester;
          if (hasHeader("Batch")) preview.batch = batch;
          if (hasHeader("Designation")) preview.designation = designation;
          for (const [field, aliases] of Object.entries(columnAliases)) {
            if (subjectColumnsPresent[field]) {
              const value = getCell(r, aliases);
              preview[field as keyof UserPreviewRow] = String(value ?? "").trim() as never;
            }
          }
          return preview;
        });

        // Validation filter
        const invalid = mapped.filter(u => !u.email || !u.name);
        if (invalid.length > 0) {
          setParsingError(`Found ${invalid.length} row(s) missing required Email or Full Name.`);
        }

        setParsedRows(mapped);
      } catch (err: any) {
        setParsingError(`Failed to parse file: ${err.message}`);
        setParsedRows([]);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const fakeEvent = { target: { files: [f] } } as any;
      handleFileChange(fakeEvent);
    }
  };

  const handleUploadToDb = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch("/api/admin/users/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: parsedRows }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadResult({
          success: true,
          created: data.created,
          updated: data.updated,
          message: `Onboarded ${data.createdCount} new users and updated ${data.updatedCount} existing accounts.${data.errors?.length ? ` ${data.errors.length} row(s) were skipped: ${data.errors.join("; ")}` : ""}`,
        });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Failed to commit user accounts to database.",
        });
      }
    } catch (e: any) {
      setUploadResult({
        success: false,
        message: e.message || "Network error occurred while uploading users.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setParsedRows([]);
    setParsingError(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const studentCount = parsedRows.filter(r => r.role === "STUDENT").length;
  const facultyCount = parsedRows.filter(r => r.role === "FACULTY").length;
  const hodCount = parsedRows.filter(r => r.role === "HOD").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Banner Card */}
      <div className="student-card premium-card" style={{ padding: "1.75rem", borderLeft: "4px solid #10b981" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ backgroundColor: currentModeConfig.badgeBg, color: currentModeConfig.badgeColor, padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                MODE: {selectedMode}
              </span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
              {currentModeConfig.title}
            </h2>
            <p style={{ margin: "0.4rem 0 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              {currentModeConfig.description} Select user mode below to dynamically configure column templates and validation rules.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleDownloadTemplate("xlsx")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Download size={14} color="#10b981" /> Template (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadTemplate("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 0.9rem",
                borderRadius: "8px",
                border: "1px solid var(--border-subtle)",
                backgroundColor: "var(--bg-input)",
                color: "var(--text-main)",
                fontSize: "0.8rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Download size={14} color="var(--sky-blue)" /> Template (.csv)
            </button>
          </div>
        </div>

        {/* 1. SELECT USER MODE TABS */}
        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid var(--border-subtle)" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.75rem" }}>
            Step 1: Select User Mode for Onboarding
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            {(["STUDENT", "FACULTY", "HOD", "ALL"] as UserOnboardMode[]).map((modeKey) => {
              const cfg = MODE_COLUMNS[modeKey];
              const IconComp = cfg.icon;
              const isSelected = selectedMode === modeKey;

              return (
                <div
                  key={modeKey}
                  onClick={() => {
                    setSelectedMode(modeKey);
                    // clear file on mode switch to ensure correct template matching
                    handleClear();
                  }}
                  style={{
                    padding: "0.9rem 1rem",
                    borderRadius: "10px",
                    border: isSelected ? `2px solid ${cfg.badgeColor}` : "1px solid var(--border-subtle)",
                    backgroundColor: isSelected ? cfg.badgeBg : "var(--bg-input)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "8px",
                    backgroundColor: isSelected ? cfg.badgeColor : "rgba(255,255,255,0.08)",
                    color: isSelected ? "#fff" : cfg.badgeColor,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <IconComp size={18} />
                  </div>
                  <div>
                    <strong style={{ fontSize: "0.9rem", color: isSelected ? cfg.badgeColor : "var(--text-main)", display: "block" }}>
                      {modeKey === "ALL" ? "All Roles (Mixed)" : `${modeKey} Mode`}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {modeKey === "STUDENT" && "Roll No, Sem, Sec, Dept"}
                      {modeKey === "FACULTY" && "MTS No, Designation, Dept"}
                      {modeKey === "HOD" && "MTS No, Dept, Head Role"}
                      {modeKey === "ALL" && "All combined with Role col"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC COLUMN REQUIREMENTS TABLE */}
      <div className="student-card premium-card" style={{ padding: "1.5rem" }}>
        <div 
          onClick={() => setShowFormatGuide(!showFormatGuide)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Info size={18} color={currentModeConfig.badgeColor} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              Step 2: Required Columns for {selectedMode} Mode
            </h3>
          </div>
          <span style={{ fontSize: "0.85rem", color: currentModeConfig.badgeColor, fontWeight: "600" }}>
            {showFormatGuide ? "Hide Column Details ▲" : "Show Column Details ▼"}
          </span>
        </div>

        {showFormatGuide && (
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              Ensure your Excel sheet (.xlsx, .csv) contains the following header row. Header matching is case-insensitive:
            </p>

            <div className="responsive-table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-input)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>COLUMN HEADER</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>REQUIREMENT</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>SAMPLE VALUE</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>TARGET FIELD</th>
                  </tr>
                </thead>
                <tbody>
                  {currentModeConfig.columnsGuide.map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: "700", color: "var(--text-main)" }}>
                        <code>{item.col}</code>
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem" }}>
                        <span style={{ 
                          padding: "0.15rem 0.45rem", 
                          borderRadius: "4px", 
                          fontSize: "0.7rem", 
                          fontWeight: "700",
                          backgroundColor: item.req === "Required" ? "rgba(239, 68, 68, 0.15)" : item.req === "Recommended" ? "rgba(245, 158, 11, 0.15)" : "rgba(100, 116, 139, 0.15)",
                          color: item.req === "Required" ? "#ef4444" : item.req === "Recommended" ? "#f59e0b" : "var(--text-muted)"
                        }}>
                          {item.req}
                        </span>
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-main)", fontFamily: "monospace" }}>
                        {item.sample}
                      </td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>
                        {item.desc}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. DRAG & DROP UPLOAD */}
      <div className="student-card premium-card" style={{ padding: "1.75rem" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "0.75rem" }}>
          Step 3: Upload Excel Sheet for {selectedMode} Mode
        </span>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--border-subtle)",
            borderRadius: "12px",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: file ? "rgba(16, 185, 129, 0.04)" : "var(--bg-input)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = currentModeConfig.badgeColor}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{
              width: "50px",
              height: "50px",
              borderRadius: "12px",
              backgroundColor: currentModeConfig.badgeBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: currentModeConfig.badgeColor
            }}>
              <UploadCloud size={24} />
            </div>

            <div>
              <strong style={{ fontSize: "1rem", color: "var(--text-main)", display: "block" }}>
                {file ? file.name : `Click or Drag & Drop ${selectedMode} Excel Sheet`}
              </strong>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB • Ready to extract & onboard` : "Supports .xlsx and .csv"}
              </span>
            </div>
          </div>
        </div>

        {/* Error Notification */}
        {parsingError && (
          <div style={{
            marginTop: "1rem",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#ef4444",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <AlertCircle size={16} />
            <span>{parsingError}</span>
          </div>
        )}

        {/* Upload Result Notification */}
        {uploadResult && (
          <div style={{
            marginTop: "1rem",
            padding: "0.85rem 1.1rem",
            borderRadius: "8px",
            backgroundColor: uploadResult.success ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${uploadResult.success ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: uploadResult.success ? "#10b981" : "#ef4444",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            {uploadResult.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <div>
              <strong>{uploadResult.success ? "Success:" : "Error:"}</strong> {uploadResult.message}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {parsedRows.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
            marginTop: "1.25rem",
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", gap: "1rem", fontSize: "0.85rem", color: "var(--text-muted)" }}>
              <span>Total Parsed: <strong style={{ color: "var(--text-main)" }}>{parsedRows.length}</strong></span>
              {studentCount > 0 && <span>Students: <strong style={{ color: "var(--sky-blue)" }}>{studentCount}</strong></span>}
              {facultyCount > 0 && <span>Faculty: <strong style={{ color: "#10b981" }}>{facultyCount}</strong></span>}
              {hodCount > 0 && <span>HODs: <strong style={{ color: "#a855f7" }}>{hodCount}</strong></span>}
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleClear}
                disabled={uploading}
                style={{
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>

              <button
                onClick={handleUploadToDb}
                disabled={uploading}
                style={{
                  padding: "0.6rem 1.25rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--royal-blue)",
                  color: "white",
                  fontSize: "0.85rem",
                  fontWeight: "700",
                  cursor: uploading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={15} className="spin-animation" />
                    Saving Accounts to Database...
                  </>
                ) : (
                  <>
                    <UserPlus size={15} />
                    Import {parsedRows.length} {selectedMode} Users to Database
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. PREVIEW TABLE */}
      {parsedRows.length > 0 && (
        <div className="student-card premium-card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: "700", margin: "0 0 1rem 0", color: "var(--text-main)" }}>
            Extracted Preview ({parsedRows.length} Users)
          </h3>

          <div className="responsive-table-wrapper" style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-card-header)", borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)" }}>
                  <th style={{ padding: "0.5rem 0.6rem" }}>#</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Full Name</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Email Address</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Role</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>VM No</th>
                  <th style={{ padding: "0.5rem 0.6rem" }}>Dept</th>
                  {selectedMode === "STUDENT" && <th style={{ padding: "0.5rem 0.6rem" }}>Sem / Sec</th>}
                  {(selectedMode === "FACULTY" || selectedMode === "HOD") && <th style={{ padding: "0.5rem 0.6rem" }}>Designation</th>}
                  {(selectedMode === "FACULTY" || selectedMode === "ALL") && (
                    <>
                      <th style={{ padding: "0.5rem 0.6rem" }}>Subject 1</th>
                      <th style={{ padding: "0.5rem 0.6rem" }}>Subject 2</th>
                      <th style={{ padding: "0.5rem 0.6rem" }}>Lab 1</th>
                      <th style={{ padding: "0.5rem 0.6rem" }}>Add 1</th>
                      <th style={{ padding: "0.5rem 0.6rem" }}>Add 2</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {parsedRows.map((u, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--text-muted)" }}>{idx + 1}</td>
                    <td style={{ padding: "0.45rem 0.6rem", fontWeight: "600", color: "var(--text-main)" }}>{u.name}</td>
                    <td style={{ padding: "0.45rem 0.6rem", color: "var(--sky-blue)" }}>{u.email}</td>
                    <td style={{ padding: "0.45rem 0.6rem" }}>
                      <span style={{
                        padding: "0.15rem 0.4rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        backgroundColor: u.role === "STUDENT" ? "rgba(56, 189, 248, 0.15)" : u.role === "FACULTY" ? "rgba(16, 185, 129, 0.15)" : "rgba(168, 85, 247, 0.15)",
                        color: u.role === "STUDENT" ? "var(--sky-blue)" : u.role === "FACULTY" ? "#10b981" : "#a855f7"
                      }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: "0.45rem 0.6rem", fontFamily: "monospace" }}>{u.vmNo || "-"}</td>
                    <td style={{ padding: "0.45rem 0.6rem", fontWeight: "600" }}>{u.department}</td>
                    {selectedMode === "STUDENT" && (
                      <td style={{ padding: "0.45rem 0.6rem" }}>Sem {u.semester} / {u.section}</td>
                    )}
                    {(selectedMode === "FACULTY" || selectedMode === "HOD") && (
                      <td style={{ padding: "0.45rem 0.6rem" }}>{u.designation}</td>
                    )}
                    {(selectedMode === "FACULTY" || selectedMode === "ALL") && (
                      <>
                        <td style={{ padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: u.subject1 ? "var(--text-main)" : "var(--text-muted)" }}>{u.subject1 || "—"}</td>
                        <td style={{ padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: u.subject2 ? "var(--text-main)" : "var(--text-muted)" }}>{u.subject2 || "—"}</td>
                        <td style={{ padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: u.lab1 ? "var(--text-main)" : "var(--text-muted)" }}>{u.lab1 || "—"}</td>
                        <td style={{ padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: u.additional1 ? "var(--text-main)" : "var(--text-muted)" }}>{u.additional1 || "—"}</td>
                        <td style={{ padding: "0.45rem 0.6rem", fontSize: "0.75rem", color: u.additional2 ? "var(--text-main)" : "var(--text-muted)" }}>{u.additional2 || "—"}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
