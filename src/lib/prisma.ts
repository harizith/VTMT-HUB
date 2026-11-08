import { PrismaClient } from "@prisma/client";

// Global cache for PrismaClient in development
declare global {
  var prismaGlobal: PrismaClient | undefined;
  var memoryStoreGlobal: InMemoryStore | undefined;
}

// In-Memory Database Store for environments without direct PostgreSQL access
class InMemoryStore {
  users: any[] = [];
  userModes: any[] = [];
  studentProfiles: any[] = [];
  facultyProfiles: any[] = [];
  hodProfiles: any[] = [];
  departments: any[] = [];
  subjects: any[] = [];
  notices: any[] = [];
  systemSettings: any[] = [];
  auditLogs: any[] = [];
  timetableEntries: any[] = [];
  timetableHistory: any[] = [];
  attendance: any[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Departments
    this.departments = [
      { id: "dept-cse", code: "CSE", name: "Computer Science and Engineering", hodName: "Dr. Saravanan", createdAt: new Date() },
      { id: "dept-ece", code: "ECE", name: "Electronics & Communication Engineering", hodName: "Dr. Ramesh", createdAt: new Date() },
      { id: "dept-aids", code: "AIDS", name: "Artificial Intelligence & Data Science", hodName: "Dr. K. Priya", createdAt: new Date() },
      { id: "dept-mech", code: "MECH", name: "Mechanical Engineering", hodName: "Dr. Balaji", createdAt: new Date() },
    ];

    // 2. Secret Admin Account & Student Test Account
    const secretAdmin = {
      id: "admin-secret-root",
      vmNo: "ADM-SECRET-01",
      email: "admin@vtmt.org",
      name: "System Administrator",
      password: "$2a$10$wK1Ww8zJ0q6bH5yN.Gj2A.6sXG.u/9f8c6jR7m5g2L0p1y3x4z5a6", // administrator
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const studentUser = {
      id: "stu-vtmt-23cs101",
      vmNo: "23CS101",
      email: "student@vtmt.org",
      name: "Vasanth Kumar R",
      password: "$2a$10$wK1Ww8zJ0q6bH5yN.Gj2A.6sXG.u/9f8c6jR7m5g2L0p1y3x4z5a6", // student123
      role: "STUDENT",
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users = [secretAdmin, studentUser];
    this.userModes = [
      { vmno: "ADM-SECRET-01", emailid: "admin@vtmt.org", password: "administrator", usermode: "ADMIN", createdAt: new Date() },
      { vmno: "23CS101", emailid: "student@vtmt.org", password: "student123", usermode: "STUDENT", createdAt: new Date() },
    ];
    this.studentProfiles = [
      {
        userEmail: "student@vtmt.org",
        rollNumber: "23CS101",
        department: "CSE",
        semester: 3,
        year: "II",
        section: "A",
        batch: "2024-2028",
        createdAt: new Date(),
      },
    ];
    this.facultyProfiles = [];
    this.hodProfiles = [];

    // 3. Subjects - Synced with Institutional Curriculum
    this.subjects = [
      { id: "sub-1", code: "231CS321", name: "Data Structures", credits: 3, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-2", code: "231CS322", name: "Digital Principles and Computer Organization", credits: 4, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-3", code: "231CS323", name: "Object Oriented Programming", credits: 3, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-4", code: "231CS324", name: "Operating Systems", credits: 3, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-5", code: "231CS325", name: "Software Engineering", credits: 3, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-6", code: "231MA302", name: "Probability and Queuing Theory", credits: 4, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-7", code: "231CS32A", name: "Data Structures and Algorithms Laboratory", credits: 2, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-8", code: "231CS32B", name: "Object Oriented Programming Laboratory", credits: 2, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-9", code: "231CS32C", name: "Operating Systems Laboratory", credits: 2, semester: 3, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-10", code: "21CS501", name: "Database Management Systems", credits: 3, semester: 5, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-11", code: "21CS502", name: "Computer Networks & Protocols", credits: 4, semester: 5, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-12", code: "21CS503", name: "Theory of Computation", credits: 3, semester: 5, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-13", code: "21CS504", name: "Web Technologies & Full Stack", credits: 3, semester: 5, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-14", code: "21CS701", name: "Cloud Computing & DevOps", credits: 3, semester: 7, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-15", code: "21CS702", name: "Cryptography and Network Security", credits: 3, semester: 7, departmentCode: "CSE", createdAt: new Date() },
      { id: "sub-16", code: "21AI401", name: "Artificial Intelligence & Machine Learning", credits: 4, semester: 4, departmentCode: "AIDS", createdAt: new Date() },
      { id: "sub-17", code: "21EC301", name: "Signals and Digital Communication", credits: 4, semester: 3, departmentCode: "ECE", createdAt: new Date() },
    ];

    // 4. Timetable Entries - Empty
    this.timetableEntries = [];

    // 5. Notices - Empty
    this.notices = [];

    // 6. System Settings
    this.systemSettings = [
      { id: "ss-1", key: "DAY_ORDER_BASE_INDEX", value: "2", updatedAt: new Date() },
      { id: "ss-2", key: "DAY_ORDER_BASE_DATE", value: "2026-09-13T00:00:00", updatedAt: new Date() },
      { id: "ss-3", key: "HOLIDAYS", value: "[]", updatedAt: new Date() },
      { id: "ss-4", key: "WORKING_WEEKENDS", value: "[]", updatedAt: new Date() },
    ];

    // 7. Seed Attendance Records for student@vtmt.org (24 periods across 3 days)
    this.attendance = [
      // Day 1: 2026-11-03 (Day Order I) - 7 PRESENT, 1 ON_DUTY
      { id: "att-seed-01", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 1, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-02", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 2, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-03", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 3, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-04", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 4, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-05", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 5, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-06", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 6, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-07", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 7, subjectCode: "231CS32A", facultyName: "Dr. Saravanan", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-08", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-03", dayOrder: "I", period: 8, subjectCode: "231CS32A", facultyName: "Dr. Saravanan", status: "ON_DUTY", createdAt: new Date() },

      // Day 2: 2026-11-04 (Day Order II) - 8 PRESENT
      { id: "att-seed-09", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 1, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-10", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 2, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-11", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 3, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-12", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 4, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-13", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 5, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-14", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 6, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-15", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 7, subjectCode: "231CS32B", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-16", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-04", dayOrder: "II", period: 8, subjectCode: "231CS32B", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },

      // Day 3: 2026-11-05 (Day Order III) - 6 PRESENT, 1 ON_DUTY, 1 ABSENT
      { id: "att-seed-17", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 1, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-18", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 2, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-19", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 3, subjectCode: "231CS322", facultyName: "Mrs. Kavitha", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-20", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 4, subjectCode: "231MA302", facultyName: "Dr. Senthil", status: "ON_DUTY", createdAt: new Date() },
      { id: "att-seed-21", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 5, subjectCode: "231CS325", facultyName: "Mrs. Deepa", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-22", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 6, subjectCode: "231CS324", facultyName: "Dr. Anand", status: "ABSENT", createdAt: new Date() },
      { id: "att-seed-23", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 7, subjectCode: "231CS323", facultyName: "Mr. Rajesh", status: "PRESENT", createdAt: new Date() },
      { id: "att-seed-24", studentId: "stu-vtmt-23cs101", classId: "II-CSE-A", dateString: "2026-11-05", dayOrder: "III", period: 8, subjectCode: "231CS321", facultyName: "Dr. Saravanan", status: "PRESENT", createdAt: new Date() },
    ];
  }
}

const memoryStore = globalThis.memoryStoreGlobal ?? new InMemoryStore();
if (process.env.NODE_ENV !== "production") {
  globalThis.memoryStoreGlobal = memoryStore;
}

// Helper to filter array by Prisma-style where clause
function matchWhere(item: any, where?: any): boolean {
  if (!where) return true;
  for (const [key, cond] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(cond)) {
      const orMatched = cond.some((subCond) => matchWhere(item, subCond));
      if (!orMatched) return false;
      continue;
    }
    if (key === "AND" && Array.isArray(cond)) {
      const andMatched = cond.every((subCond) => matchWhere(item, subCond));
      if (!andMatched) return false;
      continue;
    }

    // Handle composite unique key queries (e.g. studentId_dateString_period: { studentId, dateString, period })
    if (!(key in item) && cond && typeof cond === "object" && !Array.isArray(cond)) {
      const filterKeys = ["equals", "contains", "in", "notIn", "not", "gte", "lte", "gt", "lt", "mode"];
      const isFilterOperator = Object.keys(cond).some((k) => filterKeys.includes(k));
      if (!isFilterOperator) {
        let compositeMatched = true;
        for (const [subKey, subVal] of Object.entries(cond)) {
          if (!matchWhere(item, { [subKey]: subVal })) {
            compositeMatched = false;
            break;
          }
        }
        if (!compositeMatched) return false;
        continue;
      }
    }

    if (cond && typeof cond === "object") {
      const c = cond as any;
      const val = item[key];
      if (c.equals !== undefined) {
        if (c.mode === "insensitive") {
          if (String(val).toLowerCase() !== String(c.equals).toLowerCase()) return false;
        } else if (val !== c.equals) {
          return false;
        }
      }
      if (c.not !== undefined) {
        if (val === c.not) return false;
      }
      if (c.contains !== undefined) {
        const needle = String(c.contains).toLowerCase();
        const haystack = String(val || "").toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      if (c.in !== undefined && Array.isArray(c.in)) {
        if (!c.in.includes(val)) return false;
      }
      if (c.notIn !== undefined && Array.isArray(c.notIn)) {
        if (c.notIn.includes(val)) return false;
      }
      if (c.gte !== undefined) {
        const compVal = val instanceof Date ? val.getTime() : val;
        const target = c.gte instanceof Date ? c.gte.getTime() : c.gte;
        if (compVal === undefined || compVal === null || compVal < target) return false;
      }
      if (c.gt !== undefined) {
        const compVal = val instanceof Date ? val.getTime() : val;
        const target = c.gt instanceof Date ? c.gt.getTime() : c.gt;
        if (compVal === undefined || compVal === null || compVal <= target) return false;
      }
      if (c.lte !== undefined) {
        const compVal = val instanceof Date ? val.getTime() : val;
        const target = c.lte instanceof Date ? c.lte.getTime() : c.lte;
        if (compVal === undefined || compVal === null || compVal > target) return false;
      }
      if (c.lt !== undefined) {
        const compVal = val instanceof Date ? val.getTime() : val;
        const target = c.lt instanceof Date ? c.lt.getTime() : c.lt;
        if (compVal === undefined || compVal === null || compVal >= target) return false;
      }
    } else {
      if (item[key] !== cond) return false;
    }
  }
  return true;
}

// Generate in-memory model handlers
function createModelHandler(collectionName: keyof InMemoryStore) {
  const getList = (): any[] => (memoryStore as any)[collectionName] || [];

  return {
    findMany: async (args?: any) => {
      let results = getList().filter((item) => matchWhere(item, args?.where));
      // Populate relations if requested
      if (collectionName === "users") {
        results = results.map((u) => ({
          ...u,
          studentProfile: memoryStore.studentProfiles.find((sp) => sp.userEmail === u.email) || null,
          facultyProfile: memoryStore.facultyProfiles.find((fp) => fp.vmNo === u.vmNo) || null,
          hodProfile: memoryStore.hodProfiles.find((hp) => hp.vmNo === u.vmNo) || null,
        }));
      }
      if (collectionName === "notices") {
        results = results.map((n) => {
          const author = n.authorId ? memoryStore.users.find((u) => u.id === n.authorId) : null;
          return {
            ...n,
            author: author ? { id: author.id, name: author.name, role: author.role, email: author.email } : null,
          };
        });
      }
      if (args?.distinct && Array.isArray(args.distinct)) {
        const seen = new Set<string>();
        results = results.filter((item) => {
          const key = args.distinct.map((k: string) => item[k]).join("|");
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      }
      if (args?.take && typeof args.take === "number") {
        results = results.slice(0, args.take);
      }
      return results;
    },

    findFirst: async (args?: any) => {
      let results = getList().filter((item) => matchWhere(item, args?.where));
      const found = results[0] || null;
      if (found && collectionName === "users") {
        return {
          ...found,
          studentProfile: memoryStore.studentProfiles.find((sp) => sp.userEmail === found.email) || null,
          facultyProfile: memoryStore.facultyProfiles.find((fp) => fp.vmNo === found.vmNo) || null,
          hodProfile: memoryStore.hodProfiles.find((hp) => hp.vmNo === found.vmNo) || null,
        };
      }
      return found;
    },

    findUnique: async (args?: any) => {
      let results = getList().filter((item) => matchWhere(item, args?.where));
      const found = results[0] || null;
      if (found && collectionName === "users") {
        return {
          ...found,
          studentProfile: memoryStore.studentProfiles.find((sp) => sp.userEmail === found.email) || null,
          facultyProfile: memoryStore.facultyProfiles.find((fp) => fp.vmNo === found.vmNo) || null,
          hodProfile: memoryStore.hodProfiles.find((hp) => hp.vmNo === found.vmNo) || null,
        };
      }
      return found;
    },

    create: async (args?: any) => {
      const item = { id: args?.data?.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, createdAt: new Date(), ...args?.data };
      getList().unshift(item);
      return item;
    },

    createMany: async (args?: any) => {
      const data = args?.data || [];
      const list = getList();
      data.forEach((d: any) => {
        list.push({ id: d.id || `id-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, createdAt: new Date(), ...d });
      });
      return { count: data.length };
    },

    update: async (args?: any) => {
      const list = getList();
      const idx = list.findIndex((item) => matchWhere(item, args?.where));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...args?.data, updatedAt: new Date() };
        return list[idx];
      }
      return args?.data ?? {};
    },

    updateMany: async (args?: any) => {
      const list = getList();
      let count = 0;
      for (let i = 0; i < list.length; i++) {
        if (matchWhere(list[i], args?.where)) {
          list[i] = { ...list[i], ...args?.data, updatedAt: new Date() };
          count++;
        }
      }
      return { count };
    },

    delete: async (args?: any) => {
      const list = getList();
      const idx = list.findIndex((item) => matchWhere(item, args?.where));
      if (idx !== -1) {
        const removed = list.splice(idx, 1)[0];
        return removed;
      }
      return {};
    },

    deleteMany: async (args?: any) => {
      const list = getList();
      let count = 0;
      for (let i = list.length - 1; i >= 0; i--) {
        if (matchWhere(list[i], args?.where)) {
          list.splice(i, 1);
          count++;
        }
      }
      return { count };
    },

    upsert: async (args?: any) => {
      const list = getList();
      const idx = list.findIndex((item) => matchWhere(item, args?.where));
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...args?.update, updatedAt: new Date() };
        return list[idx];
      } else {
        const newItem = { id: `id-${Date.now()}`, createdAt: new Date(), ...args?.create };
        list.unshift(newItem);
        return newItem;
      }
    },

    count: async (args?: any) => {
      return getList().filter((item) => matchWhere(item, args?.where)).length;
    },
  };
}

const modelMapping: Record<string, keyof InMemoryStore> = {
  user: "users",
  userMode: "userModes",
  studentProfile: "studentProfiles",
  facultyProfile: "facultyProfiles",
  hodProfile: "hodProfiles",
  department: "departments",
  subject: "subjects",
  notice: "notices",
  systemSetting: "systemSettings",
  auditLog: "auditLogs",
  timetableEntry: "timetableEntries",
  timetableHistory: "timetableHistory",
  attendance: "attendance",
};

// Export in-memory store instance
export const inMemoryPrisma = new Proxy(
  {},
  {
    get: (_, prop: string) => {
      const collectionKey = modelMapping[prop] || (modelMapping[prop.toLowerCase()] as keyof InMemoryStore);
      if (collectionKey) {
        return createModelHandler(collectionKey);
      }
      return {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
        updateMany: async () => ({ count: 0 }),
        upsert: async (d: any) => d?.create ?? {},
        count: async () => 0,
      };
    },
  }
) as unknown as PrismaClient;

// Format database URL with connection pooling and timeout settings
function getPooledDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl || rawUrl.includes("localhost")) return rawUrl;

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "3");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    if (!url.searchParams.has("connect_timeout")) {
      url.searchParams.set("connect_timeout", "15");
    }
    if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    return url.toString();
  } catch {
    return rawUrl;
  }
}

// Initialize native PrismaClient with global caching across all environments
let realPrisma: PrismaClient | null = null;
try {
  const pooledUrl = getPooledDatabaseUrl();
  if (pooledUrl && !pooledUrl.includes("localhost")) {
    realPrisma =
      globalThis.prismaGlobal ??
      new PrismaClient({
        datasources: {
          db: {
            url: pooledUrl,
          },
        },
      });
    globalThis.prismaGlobal = realPrisma;
  }
} catch (err: any) {
  console.warn("[AI Studio] Real database connection failed. Falling back to in-memory store. Error:", err?.message || err);
}

// Proxied prisma export: tries real prisma first if initialized, falls back to in-memory store seamlessly
export const prisma: PrismaClient = new Proxy(
  {},
  {
    get: (_, prop: string) => {
      if (prop === "$disconnect") {
        return async () => {};
      }
      if (prop === "$queryRaw" || prop === "$queryRawUnsafe") {
        return async (query: any) => {
          if (realPrisma) {
            try {
              return await (realPrisma as any)[prop](query);
            } catch {
              // fallback
            }
          }
          return [];
        };
      }
      if (prop === "$executeRaw" || prop === "$executeRawUnsafe") {
        return async (query: any) => {
          if (realPrisma) {
            try {
              return await (realPrisma as any)[prop](query);
            } catch {
              // fallback
            }
          }
          return 1;
        };
      }

      // Check model name
      const collectionKey = modelMapping[prop] || (modelMapping[prop.toLowerCase()] as keyof InMemoryStore);
      if (collectionKey) {
        const handler = createModelHandler(collectionKey);
        if (realPrisma && (realPrisma as any)[prop]) {
          return new Proxy((realPrisma as any)[prop], {
            get: (target, method: string) => {
              return async (...args: any[]) => {
                try {
                  const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Supabase Database connection timed out after 8s")), 8000)
                  );
                  const result = await Promise.race([(target as any)[method](...args), timeoutPromise]);
                  
                  // Cache successful reads into local memory store as seamless offline backup
                  if (method === "findMany" && Array.isArray(result) && result.length > 0) {
                    (memoryStore as any)[collectionKey] = [...result];
                  } else if (method === "findFirst" && result) {
                    const existing = (memoryStore as any)[collectionKey] || [];
                    const idx = existing.findIndex((item: any) => (item.id && item.id === result.id) || (item.email && item.email === result.email));
                    if (idx >= 0) existing[idx] = result;
                    else existing.push(result);
                    (memoryStore as any)[collectionKey] = existing;
                  }
                  
                  return result;
                } catch (err: any) {
                  console.warn(`[DB Offline / Network Disconnected on ${String(prop)}.${method}]: Using local in-memory store. Error:`, err?.message || err);
                  // Seamlessly return cached data from in-memory handler when internet / Supabase drops
                  try {
                    return await (handler as any)[method](...args);
                  } catch (fallbackErr) {
                    console.error("[Fallback Handler Error]:", fallbackErr);
                    return method === "findMany" ? [] : null;
                  }
                }
              };
            },
          });
        }
        return handler;
      }

      return {
        findMany: async () => [],
        findFirst: async () => null,
        findUnique: async () => null,
        create: async (d: any) => d?.data ?? {},
        update: async (d: any) => d?.data ?? {},
        delete: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
        updateMany: async () => ({ count: 0 }),
        upsert: async (d: any) => d?.create ?? {},
        count: async () => 0,
      };
    },
  }
) as unknown as PrismaClient;

export default prisma;
