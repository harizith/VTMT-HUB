"use client";

import { useEffect, useState } from "react";
import CourseCatalog from "@/components/CourseCatalog";

export default function HodCoursesPage() {
  const [hodDept, setHodDept] = useState("CSE");
  const [departments, setDepartments] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/hod/dashboard").then((r) => r.json()).catch(() => null),
      fetch("/api/admin/departments").then((r) => r.json()).catch(() => null),
    ]).then(([dashRes, deptRes]) => {
      if (dashRes?.success && dashRes?.data?.hod?.department) {
        setHodDept(dashRes.data.hod.department);
      }
      if (deptRes?.success && deptRes?.departments) {
        setDepartments(deptRes.departments);
      }
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "var(--text-muted)", fontSize: "0.95rem" }}>
          <div style={{ width: "20px", height: "20px", border: "2px solid var(--border-subtle)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <span>Loading course catalog & governance...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <CourseCatalog
        mode="hod"
        department={hodDept}
        departments={departments}
      />
    </div>
  );
}
