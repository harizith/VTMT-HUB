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

  return (
    <div style={{ padding: "2rem" }}>
      <CourseCatalog
        mode="hod"
        department={hodDept}
        departments={departments}
      />
    </div>
  );
}
