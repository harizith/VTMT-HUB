"use client";

import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  UploadCloud, 
  FileSpreadsheet, 
  FileText,
  Download, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  RefreshCw, 
  Trash2,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";

interface TimetablePreviewRow {
  classId: string | null;
  dayOrder: string | null;
  period: number | null;
  timeRange: string | null;
  subjectCode: string | null;
  subjectName: string | null;
  facultyName: string | null;
  vmsNo?: string;
  roomNo: string | null;
  category?: string;
  semType?: string | null;
}

export default function AdminTimetableExcelUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"excel" | "doc" | null>(null);
  const [parsedRows, setParsedRows] = useState<TimetablePreviewRow[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; count?: number; message?: string } | null>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample data template definition
  const SAMPLE_ROWS = [
    {
      "Class ID": "II-CSE-A",
      "Day Order": "I",
      "Period": 1,
      "Sem (Odd/Even)": "Odd",
      "Subject Code": "CS3351",
      "Subject Name": "Digital Principles & System Design",
      "Subject Category": "sub1",
      "Faculty Name": "Dr. R. Saravanan",
      "MTS No": "1944",
      "Room No": "LH-201",
      "Time Range": "08:05 - 08:55"
    },
    {
      "Class ID": "II-CSE-A",
      "Day Order": "I",
      "Period": 2,
      "Sem (Odd/Even)": "Odd",
      "Subject Code": "CS3352",
      "Subject Name": "Foundations of Data Science",
      "Subject Category": "sub2",
      "Faculty Name": "Ms. V. Vijayashanthi",
      "MTS No": "17433",
      "Room No": "LH-201",
      "Time Range": "08:55 - 09:45"
    },
    {
      "Class ID": "II-CSE-A",
      "Day Order": "I",
      "Period": 3,
      "Sem (Odd/Even)": "Odd",
      "Subject Code": "CS3391",
      "Subject Name": "Object Oriented Programming",
      "Subject Category": "lab1",
      "Faculty Name": "Mr. N. Insozhan",
      "MTS No": "1069",
      "Room No": "LH-201",
      "Time Range": "10:00 - 10:50"
    },
    {
      "Class ID": "IV-CSE-B",
      "Day Order": "II",
      "Period": 1,
      "Sem (Odd/Even)": "Odd",
      "Subject Code": "CS3701",
      "Subject Name": "Cloud Computing & DevOps",
      "Subject Category": "pe",
      "Faculty Name": "Dr. E. Mercy Beulah",
      "MTS No": "2103",
      "Room No": "N-203",
      "Time Range": "08:05 - 08:55"
    }
  ];

  const handleDownloadTemplate = (format: "xlsx" | "csv") => {
    const ws = XLSX.utils.json_to_sheet(SAMPLE_ROWS);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timetable_Template");
    if (format === "xlsx") {
      XLSX.writeFile(wb, "Timetable_Import_Template.xlsx");
    } else {
      XLSX.writeFile(wb, "Timetable_Import_Template.csv");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (f: File) => {
    setFile(f);
    setParsingError(null);
    setUploadResult(null);

    const name = f.name.toLowerCase();
    const isDoc = name.endsWith(".docx") || name.endsWith(".doc");

    if (isDoc) {
      setFileType("doc");
      // Use backend parser endpoint for doc/docx files
      try {
        const formData = new FormData();
        formData.append("file", f);
        const res = await fetch("/api/admin/timetable/parse-doc", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.rows) && data.rows.length > 0) {
          setParsedRows(data.rows);
        } else {
          setParsingError(data.error || "Could not parse timetable tables from Word document.");
          setParsedRows([]);
        }
      } catch (err: any) {
        setParsingError(err.message || "Failed to parse Word document.");
        setParsedRows([]);
      }
      return;
    }

    setFileType("excel");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<any>(worksheet, { defval: "" });

        if (!json || json.length === 0) {
          setParsingError("The selected file is empty or could not be parsed.");
          setParsedRows([]);
          return;
        }

        const normalized = (value: unknown) => String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
        const getCell = (row: any, ...aliases: string[]) => {
          const wanted = new Set(aliases.map(normalized));
          const key = Object.keys(row).find((header) => wanted.has(normalized(header)));
          return key === undefined ? "" : String(row[key] ?? "").trim();
        };
        const nullableCell = (value: string) => value || null;
        const mapped: TimetablePreviewRow[] = json.map((r: any) => {
          const periodRaw = getCell(r, "Period", "Slot");
          const parsedPeriod = periodRaw ? Number.parseInt(periodRaw, 10) : NaN;
          return {
            classId: nullableCell(getCell(r, "Class ID", "Class")),
            dayOrder: nullableCell(getCell(r, "Day Order", "Day")),
            period: Number.isInteger(parsedPeriod) && parsedPeriod >= 1 && parsedPeriod <= 8 ? parsedPeriod : null,
            timeRange: nullableCell(getCell(r, "Time Range", "Time")),
            subjectCode: nullableCell(getCell(r, "Subject Code", "SubjectCode", "Code")),
            subjectName: nullableCell(getCell(r, "Subject Name", "Subject")),
            facultyName: nullableCell(getCell(r, "Faculty Name", "Faculty", "Teacher")),
            vmsNo: getCell(r, "VMS No", "VM No", "VMS Number") || undefined,
            roomNo: nullableCell(getCell(r, "Room No", "Room")),
            category: getCell(r, "Subject Category", "Category").toLowerCase() || undefined,
            semType: nullableCell(getCell(r, "Sem (Odd/Even)", "Sem", "Semester", "Sem Type", "Semester Type")),
          };
        }).filter((row, index) => Object.values(json[index]).some(value => String(value ?? "").trim() !== ""));

        if (mapped.length === 0) {
          setParsingError("No non-empty timetable rows were found. Check the column headers in the guide below.");
          setParsedRows([]);
        } else {
          setParsedRows(mapped);
        }
      } catch (err: any) {
        console.error("Excel parse error:", err);
        setParsingError(`Failed to read file: ${err.message}`);
        setParsedRows([]);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleUploadToDb = async () => {
    if (parsedRows.length === 0) return;
    setUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch("/api/admin/timetable/import-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: parsedRows,
          mode: importMode,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setUploadResult({
          success: true,
          count: data.count,
          message: `Saved ${data.count} of ${data.totalProcessed} timetable rows. Blank values were kept blank.${data.warnings?.length ? ` ${data.warnings.join("; ")}` : ""}`,
        });
        if (onUploadSuccess) onUploadSuccess();
      } else {
        setUploadResult({
          success: false,
          message: data.error || "Failed to commit entries to database.",
        });
      }
    } catch (e: any) {
      setUploadResult({
        success: false,
        message: e.message || "Network error occurred while uploading.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileType(null);
    setParsedRows([]);
    setParsingError(null);
    setUploadResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const distinctClasses = Array.from(new Set(parsedRows.map(r => r.classId)));
  const distinctFaculty = Array.from(new Set(parsedRows.map(r => r.facultyName).filter(Boolean)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Top Header Card */}
      <div className="student-card premium-card" style={{ padding: "1.75rem", borderLeft: "4px solid var(--royal-blue)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
              <span style={{ backgroundColor: "rgba(56, 189, 248, 0.15)", color: "var(--sky-blue)", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700" }}>
                EXCEL SPREADSHEET TIMETABLE IMPORT
              </span>
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "800", margin: 0, color: "var(--text-main)" }}>
              Upload Timetables (.xlsx, .xls, .csv)
            </h2>
            <p style={{ margin: "0.4rem 0 0 0", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Upload official Excel spreadsheets or CSV files. Blank cells stay blank; only non-empty rows are imported.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={() => handleDownloadTemplate("xlsx")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Download size={15} color="var(--sky-blue)" /> Download .xlsx Template
            </button>
            <button
              onClick={() => handleDownloadTemplate("csv")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.55rem 1rem",
                borderRadius: "8px",
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border-subtle)",
                color: "var(--text-main)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              <Download size={15} color="var(--royal-blue)" /> Download .csv Template
            </button>
          </div>
        </div>
      </div>

      {/* Format Arrangement Specification Card */}
      <div className="student-card premium-card" style={{ padding: "1.5rem" }}>
        <div 
          onClick={() => setShowFormatGuide(!showFormatGuide)}
          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Info size={18} color="var(--sky-blue)" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              Standard Excel Timetable Spreadsheet Format Specification
            </h3>
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--sky-blue)", fontWeight: "600" }}>
            {showFormatGuide ? "Hide Column Details ▲" : "Show Column Details ▼"}
          </span>
        </div>

        {showFormatGuide && (
          <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
              The Excel sheet must have a header row with the following column names (case-insensitive). Blank cells are safely kept empty.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "var(--bg-input)", borderBottom: "1px solid var(--border-subtle)" }}>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>COLUMN HEADER</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>STATUS</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>DATA TYPE / FORMAT</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>SAMPLE VALUE</th>
                    <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)", fontWeight: "700" }}>EXPLANATION</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { col: "Class ID", req: "Optional", type: "Text", sample: "II-CSE-A, IV-CSE-B", note: "Used to show this entry to students in the class" },
                    { col: "Day Order", req: "Optional", type: "Roman or Number", sample: "I, II, III, IV, V (or 1-5)", note: "Unrecognized or blank values remain unassigned" },
                    { col: "Period", req: "Optional", type: "Integer (1 to 8)", sample: "1, 2, 3 ... 8", note: "Blank or invalid periods remain unset" },
                    { col: "Subject Code", req: "Optional", type: "Text", sample: "CS3351, 19CS501", note: "Stored as supplied; not inferred from the subject name" },
                    { col: "Subject Name", req: "Optional", type: "Text", sample: "Compiler Design", note: "Stored as supplied; not inferred from the subject code" },
                    { col: "Subject Category", req: "Optional", type: "Category Tag", sample: "sub1, sub2, sub3, lab1, lab2, pe, oe", note: "Flexible slot classifier for staff & HOD timetables" },
                    { col: "Faculty Name", req: "Recommended", type: "Text", sample: "Dr. R. Saravanan", note: "Lecturer / professor name" },
                    { col: "MTS No", req: "Optional", type: "Text", sample: "1944, 17433", note: "Faculty employee number (enables auto-sync to Teacher mode)" },
                    { col: "Room No", req: "Optional", type: "Text", sample: "LH-201, CS-LAB-1", note: "Lecture hall or lab room number" },
                    { col: "Time Range", req: "Optional", type: "Text", sample: "08:05 - 08:55", note: "Stored as supplied; no default is inserted" },
                  ].map((item, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "0.6rem 0.75rem", fontWeight: "700", color: "var(--text-main)" }}><code>{item.col}</code></td>
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
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>{item.type}</td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--sky-blue)", fontFamily: "monospace" }}>{item.sample}</td>
                      <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>{item.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Drag & Drop Upload Card */}
      <div className="student-card premium-card" style={{ padding: "1.75rem" }}>
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
            backgroundColor: file ? "rgba(29, 78, 216, 0.04)" : "var(--bg-input)",
            transition: "all 0.2s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "var(--royal-blue)"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "14px", backgroundColor: "rgba(56, 189, 248, 0.1)", color: "var(--sky-blue)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileSpreadsheet size={28} />
            </div>

            <div>
              <h4 style={{ margin: "0 0 0.25rem 0", fontSize: "1.1rem", fontWeight: "700", color: "var(--text-main)" }}>
                {file ? file.name : "Click to select or drag & drop Timetable Excel file"}
              </h4>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>

            {file && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem", padding: "0.3rem 0.75rem", borderRadius: "6px", backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e", fontSize: "0.8rem", fontWeight: "700" }}>
                <CheckCircle2 size={14} /> File loaded ({(file.size / 1024).toFixed(1)} KB) • {fileType === "doc" ? "Word Document" : "Spreadsheet"}
              </div>
            )}
          </div>
        </div>

        {parsingError && (
          <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#ef4444", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={16} /> {parsingError}
          </div>
        )}

        {uploadResult && (
          <div style={{
            marginTop: "1rem",
            padding: "0.85rem 1rem",
            borderRadius: "8px",
            backgroundColor: uploadResult.success ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${uploadResult.success ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            color: uploadResult.success ? "#22c55e" : "#ef4444",
            fontSize: "0.85rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            {uploadResult.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            {uploadResult.message}
          </div>
        )}

        {parsedRows.length > 0 && (
          <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Rows Ready: <strong style={{ color: "var(--text-main)" }}>{parsedRows.length}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Classes: <strong style={{ color: "var(--sky-blue)" }}>{distinctClasses.length}</strong>
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Faculty: <strong style={{ color: "var(--text-main)" }}>{distinctFaculty.length}</strong>
              </div>

              {/* Mode Toggle */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", backgroundColor: "var(--bg-input)", padding: "0.3rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                <button
                  onClick={() => setImportMode("replace")}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: importMode === "replace" ? "var(--royal-blue)" : "transparent",
                    color: importMode === "replace" ? "#fff" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Replace Target Classes
                </button>
                <button
                  onClick={() => setImportMode("append")}
                  style={{
                    padding: "0.3rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: importMode === "append" ? "var(--royal-blue)" : "transparent",
                    color: importMode === "append" ? "#fff" : "var(--text-muted)",
                    fontSize: "0.75rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  Append / Merge
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={handleClear}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.6rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                  backgroundColor: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  fontWeight: "600",
                  cursor: "pointer"
                }}
              >
                <Trash2 size={15} /> Clear
              </button>

              <button
                onClick={handleUploadToDb}
                disabled={uploading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.6rem 1.4rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "var(--royal-blue)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  cursor: uploading ? "not-allowed" : "pointer",
                  opacity: uploading ? 0.7 : 1,
                  boxShadow: "0 4px 12px rgba(29, 78, 216, 0.3)"
                }}
              >
                {uploading ? (
                  <>
                    <RefreshCw size={16} className="loading-spinner" /> Uploading to DB...
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} /> Save to Database ({parsedRows.length} Slots)
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Table Preview of Parsed Data */}
      {parsedRows.length > 0 && (
        <div className="student-card premium-card" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: 0, color: "var(--text-main)" }}>
              Data Preview (Showing first 10 of {parsedRows.length} parsed records)
            </h3>
            <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
              Review parsed columns before confirming database upload
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
              <thead>
                <tr style={{ backgroundColor: "var(--bg-input)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>#</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>CLASS</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>DAY</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>PERIOD</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>SEM (ODD/EVEN)</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>TIME RANGE</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>SUBJECT CODE</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>SUBJECT NAME</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>FACULTY</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>MTS NO</th>
                  <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-muted)" }}>ROOM</th>
                </tr>
              </thead>
              <tbody>
                {parsedRows.slice(0, 10).map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>{i + 1}</td>
                    <td style={{ padding: "0.55rem 0.75rem", fontWeight: "700", color: "var(--sky-blue)" }}>{row.classId || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", fontWeight: "700", color: "var(--text-main)" }}>{row.dayOrder ? `Day ${row.dayOrder}` : "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", fontWeight: "700" }}>{row.period ? `P${row.period}` : "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem" }}>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "0.1rem 0.4rem",
                        borderRadius: "4px",
                        backgroundColor: (row.semType?.toUpperCase() === "ODD" || !row.semType) ? "rgba(168, 85, 247, 0.15)" : "rgba(16, 185, 129, 0.15)",
                        color: (row.semType?.toUpperCase() === "ODD" || !row.semType) ? "#c084fc" : "#10b981",
                        border: (row.semType?.toUpperCase() === "ODD" || !row.semType) ? "1px solid rgba(168, 85, 247, 0.3)" : "1px solid rgba(16, 185, 129, 0.3)",
                      }}>
                        {row.semType || "Odd"}
                      </span>
                    </td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>{row.timeRange || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", fontFamily: "monospace" }}>{row.subjectCode || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-main)" }}>{row.subjectName || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>{row.facultyName || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--sky-blue)" }}>{row.vmsNo || "—"}</td>
                    <td style={{ padding: "0.55rem 0.75rem", color: "var(--text-muted)" }}>{row.roomNo || "—"}</td>
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
