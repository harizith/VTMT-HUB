import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SubjectMapping {
  [code: string]: { name: string, faculty: string, subjectCode: string }
}

const timeRanges = [
  "8.05 - 8.55",
  "8.55 - 9.45",
  "10.00 - 10.50",
  "10.50 - 11.40",
  "12.20 - 1.05",
  "1.05 - 1.50",
  "2.00 - 2.45",
  "2.45 - 3.30"
]

const timetables: any[] = [];

// Helper to push entries
function addClassTimetable(classId: string, roomNo: string, grid: string[][], subjects: SubjectMapping) {
  for (let day = 0; day < 5; day++) {
    const dayOrders = ["I", "II", "III", "IV", "V"];
    const dayOrder = dayOrders[day];
    
    for (let period = 0; period < 8; period++) {
      let cell = grid[day][period];
      let subKey = cell.trim();
      
      // Some cells might have extra spaces or be empty
      if (!subKey) continue;
      
      // Look up subject
      let mapped = subjects[subKey];
      
      if (!mapped) {
        // Fallback or exact match if not in map
        console.warn(`Missing mapping for ${subKey} in ${classId}`);
        mapped = { name: subKey, faculty: "Unknown", subjectCode: subKey };
      }

      timetables.push({
        classId,
        dayOrder,
        period: period + 1,
        timeRange: timeRanges[period],
        subjectCode: mapped.subjectCode,
        subjectName: mapped.name,
        facultyName: mapped.faculty,
        roomNo
      });
    }
  }
}

// ----------------------------------------------------
// PAGE 1: IICSEA
// ----------------------------------------------------
const sub_IICSEA: SubjectMapping = {
  "PQT": { name: "Probability and Queuing Theory", faculty: "Dr. Mattuvarkuzhali", subjectCode: "231MA302" },
  "OOPS": { name: "Object Oriented Programming", faculty: "Mr R Prabhakaran", subjectCode: "231CS323" },
  "DS": { name: "Data Structures", faculty: "Ms A Vinothini", subjectCode: "231CS321" },
  "DPCO": { name: "Digital Principles and Computer Organization", faculty: "Ms. R. Kokilapriya", subjectCode: "231CS322" },
  "SE": { name: "Software Engineering", faculty: "Ms. S. Alfiya", subjectCode: "231CS325" },
  "OS": { name: "Operating Systems", faculty: "Mr C Pandi", subjectCode: "231CS324" },
  "DS LAB": { name: "Data Structures and Algorithms Laboratory", faculty: "Ms A Vinothini", subjectCode: "231CS32A" },
  "DS/DPCO LAB BAY3": { name: "Data Structures / Digital Principles and Computer Organization Laboratory", faculty: "Ms A Vinothini / Ms. R. Kokilapriya", subjectCode: "231CS32A / 231CS322" },
  "SE LAB BAY3": { name: "Software Engineering Laboratory", faculty: "Ms. S. Alfiya", subjectCode: "231CS325" },
  "OS/OOPS LAB BAY3": { name: "Operating Systems / Object Oriented Programming Laboratory", faculty: "Mr C Pandi / Mr R Prabhakaran", subjectCode: "231CS32C / 231CS32B" },
  "PQT LAB BAY4": { name: "Probability and Queuing Theory Laboratory", faculty: "Dr. Mattuvarkuzhali", subjectCode: "231MA302" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. Sathish Kumar", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Mr R Prabhakaran", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};

const grid_IICSEA = [
  ["DS/DPCO LAB BAY3", "DS/DPCO LAB BAY3", "OOPS", "SE", "SE LAB BAY3", "SE LAB BAY3", "DPCO", "OS"], // Day I
  ["DS", "OOPS", "DS/DPCO LAB BAY3", "DS/DPCO LAB BAY3", "PQT", "LIB", "OS", "SE"], // Day II
  ["PQT", "OOPS", "DPCO", "SE", "OS/OOPS LAB BAY3", "OS/OOPS LAB BAY3", "SPORTS", "SPORTS"], // Day III
  ["PPT", "PPT", "SE", "OOPS", "DS", "DPCO", "PQT", "OS"], // Day IV
  ["DPCO", "DS", "OS/OOPS LAB BAY3", "OS/OOPS LAB BAY3", "OS", "DS", "PQT LAB BAY4", "PQT LAB BAY4"] // Day V
];
addClassTimetable("II-CSE-A", "N 201", grid_IICSEA, sub_IICSEA);

// ----------------------------------------------------
// PAGE 2: IICSEB
// ----------------------------------------------------
const sub_IICSEB: SubjectMapping = {
  "PQT": { name: "Probability and Queuing Theory", faculty: "Ms. Anupathi", subjectCode: "231MA302" },
  "OOPS": { name: "Object Oriented Programming", faculty: "Mr V Nehru", subjectCode: "231CS323" },
  "DS": { name: "Data Structures", faculty: "Ms D Parkavi", subjectCode: "231CS321" },
  "DPCO": { name: "Digital Principles and Computer Organization", faculty: "Mr.V.Senthilkumar", subjectCode: "231CS322" },
  "SE": { name: "Software Engineering", faculty: "Ms V Divya", subjectCode: "231CS325" },
  "OS": { name: "Operating Systems", faculty: "Ms Alfiya", subjectCode: "231CS324" },
  "PQT LAB BAY4": { name: "Probability and Queuing Theory Laboratory", faculty: "Ms. Anupathi", subjectCode: "231MA302" },
  "OS/OOPS LAB BAY4": { name: "Operating Systems / Object Oriented Programming Laboratory", faculty: "Ms Alfiya / Ms.P. Selvarathinam", subjectCode: "231CS32C / 231CS32B" },
  "DS/DPCO LAB BAY4": { name: "Data Structures / Digital Principles and Computer Organization Laboratory", faculty: "Ms D Parkavi / Mr.V.Senthilkumar", subjectCode: "231CS32A / 231CS322" },
  "SE LAB BAY3": { name: "Software Engineering Laboratory", faculty: "Ms V Divya", subjectCode: "231CS325" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. Sathish Kumar", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms Alfiya", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IICSEB = [
  ["DS", "OS", "PQT LAB BAY4", "PQT LAB BAY4", "SE", "OOPS", "PQT", "DPCO"], // Day I
  ["SE", "PQT", "OS/OOPS LAB BAY4", "OS/OOPS LAB BAY4", "OOPS", "DS", "SE LAB BAY3", "SE LAB BAY3"], // Day II
  ["OS", "PQT", "DPCO", "DS", "DS/DPCO LAB BAY4", "DS/DPCO LAB BAY4", "SPORTS", "SPORTS"], // Day III
  ["PPT", "PPT", "OOPS", "DPCO", "DS/DPCO LAB BAY4", "DS/DPCO LAB BAY4", "OS", "SE"], // Day IV
  ["OS/OOPS LAB BAY4", "OS/OOPS LAB BAY4", "DS", "LIB", "DPCO", "SE", "OS", "OOPS"] // Day V
];
addClassTimetable("II-CSE-B", "N 201", grid_IICSEB, sub_IICSEB);

// ----------------------------------------------------
// PAGE 3: IICSEC
// ----------------------------------------------------
const sub_IICSEC: SubjectMapping = {
  "PQT": { name: "Probability and Queuing Theory", faculty: "Dr. T. Mary shalini", subjectCode: "231MA302" },
  "OOPS": { name: "Object Oriented Programming", faculty: "Ms.R.Harini", subjectCode: "231CS323" },
  "DS": { name: "Data Structures", faculty: "Dr.E.Mercy Beulah", subjectCode: "231CS321" },
  "DPCO": { name: "Digital Principles and Computer Organization", faculty: "Mr.P.Sathish Kumar", subjectCode: "231CS322" },
  "SE": { name: "Software Engineering", faculty: "Ms.D.Parkavi", subjectCode: "231CS325" },
  "OS": { name: "Operating Systems", faculty: "Ms.J.Bebitha", subjectCode: "231CS324" },
  "DS / DPCO LAB BAY 4": { name: "Data Structures / Digital Principles and Computer Organization Laboratory", faculty: "Dr.E.Mercy Beulah / Mr.P.Sathish Kumar", subjectCode: "231CS32A / 231CS322" },
  "OOPS / OS LAB BAY3": { name: "Object Oriented Programming / Operating Systems Laboratory", faculty: "Ms.Sandhiya Sree / Ms.J.Bebitha", subjectCode: "231CS32B / 231CS32C" },
  "SE LAB BAY 4": { name: "Software Engineering Laboratory", faculty: "Ms.D.Parkavi", subjectCode: "231CS325" },
  "PQT LAB RL": { name: "Probability and Queuing Theory Laboratory", faculty: "Dr. T. Mary shalini", subjectCode: "231MA302" },
  "OOPS / OS BAY 3": { name: "Object Oriented Programming / Operating Systems Laboratory", faculty: "Ms.Sandhiya Sree / Ms.J.Bebitha", subjectCode: "231CS32B / 231CS32C" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. Sathish Kumar", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms.Sandhiya Sree", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IICSEC = [
  ["DS", "DPCO", "SE", "OS", "DS / DPCO LAB BAY 4", "DS / DPCO LAB BAY 4", "SE LAB BAY 4", "SE LAB BAY 4"], // Day I
  ["OOPS / OS LAB BAY3", "OOPS / OS LAB BAY3", "DS", "DPCO", "PQT", "OOPS", "DS / DPCO LAB BAY 4", "DS / DPCO LAB BAY 4"], // Day II
  ["OS", "SE", "OOPS", "LIB", "DS", "DPCO", "SPORTS", "SPORTS"], // Day III
  ["OOPS", "PQT", "OS", "SE", "OOPS / OS BAY 3", "OOPS / OS BAY 3", "PPT", "PPT"], // Day IV
  ["SE", "DPCO", "PQT LAB RL", "PQT LAB RL", "DS", "PQT", "OS", "OOPS"] // Day V
];
addClassTimetable("II-CSE-C", "N203", grid_IICSEC, sub_IICSEC);

// ----------------------------------------------------
// PAGE 4: IIICSEA
// ----------------------------------------------------
const sub_IIICSEA: SubjectMapping = {
  "AI&ML": { name: "Artificial Intelligence and Machine Learning", faculty: "Mr R Harini", subjectCode: "231IT521" },
  "CD": { name: "Compiler Design", faculty: "Ms V Vijayashanthi", subjectCode: "231CS521" },
  "ES&IOT": { name: "Embedded Systems and IoT", faculty: "Mr. V.Nehru", subjectCode: "231CS522" },
  "PE-1": { name: "Program Elective - 1", faculty: "Mr P Karthick / Ms S Vaitheeswari / Ms K Dhanalakshmi", subjectCode: "PE-1" },
  "PE-II": { name: "Program Elective - II", faculty: "Mr N Insozhan / Mr R Prabhakaran / Mr P Karthick", subjectCode: "PE-2" },
  "OE-1": { name: "Open Elective-1", faculty: "Ms V Lavanya / Dr K Muthukannan / Ms P Selvarathinam", subjectCode: "OE-1" },
  "ES&IOT / CD LAB Bay4": { name: "Embedded Systems and IoT / Compiler Design Laboratory", faculty: "Mr. V.Nehru / Ms V Vijayashanthi", subjectCode: "231CS52B / 231CS52A" },
  "PE-1 LAB(Bay 4)": { name: "Program Elective - 1 Laboratory", faculty: "Various", subjectCode: "PE-1 LAB" },
  "PE-II LAB (Bay 4)": { name: "Program Elective - II Laboratory", faculty: "Various", subjectCode: "PE-II LAB" },
  "OE-1 LAB": { name: "Open Elective-1 Laboratory", faculty: "Various", subjectCode: "OE-1 LAB" },
  "AI&ML lab bay4": { name: "Artificial Intelligence and Machine Learning Laboratory", faculty: "Mr R Harini", subjectCode: "231IT521" },
  "Seminar": { name: "Standards for Engineering", faculty: "Dr Victor Jose", subjectCode: "231MC56A" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. V. Nehru", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms V Vijayashanthi", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" },
  "AIML": { name: "Artificial Intelligence and Machine Learning", faculty: "Mr R Harini", subjectCode: "231IT521" }
};
const grid_IIICSEA = [
  ["AI&ML", "CD", "ES&IOT / CD LAB Bay4", "ES&IOT / CD LAB Bay4", "PE-II", "OE-1", "Seminar", "Seminar"], // Day I 
  ["PE-1", "ES&IOT", "PPT", "PPT", "PE-1 LAB(Bay 4)", "PE-1 LAB(Bay 4)", "PE-II", "CD"], // Day II
  ["ES&IOT / CD LAB Bay4", "ES&IOT / CD LAB Bay4", "OE-1", "ES&IOT", "LIB", "AI&ML", "SPORTS", "SPORTS"], // Day III 
  ["PPT", "PPT", "OE-1 LAB", "OE-1 LAB", "PE-1", "ES&IOT", "PE-II LAB (Bay 4)", "PE-II LAB (Bay 4)"], // Day IV
  ["PE-II", "CD", "AIML", "ES&IOT", "AI&ML lab bay4", "AI&ML lab bay4", "PE-1", "CD"] // Day V
];
addClassTimetable("III-CSE-A", "N 204", grid_IIICSEA, sub_IIICSEA);

// ----------------------------------------------------
// PAGE 5: IIICSEB
// ----------------------------------------------------
const sub_IIICSEB: SubjectMapping = {
  "AI&ML": { name: "Artificial Intelligence and Machine Learning", faculty: "Dr K Muthukannan", subjectCode: "231IT521" },
  "CD": { name: "Compiler Design", faculty: "Ms R Chandra", subjectCode: "231CS521" },
  "ES&IOT": { name: "Embedded Systems and IoT", faculty: "Ms M Aswin Rani", subjectCode: "231CS522" },
  "PE-1": { name: "Program Elective - 1", faculty: "Mr P Karthick / Ms S Vaitheeswari / Ms K Dhanalakshmi", subjectCode: "PE-1" },
  "PE-II": { name: "Program Elective - II", faculty: "Mr N Insozhan / Mr R Prabhakaran / Mr P Karthick", subjectCode: "PE-2" },
  "OE-1": { name: "Open Elective-1", faculty: "Ms V Lavanya / Dr K Muthukannan / Ms P Selvarathinam", subjectCode: "OE-1" },
  "AI&ML LAB (RLAB)": { name: "Artificial Intelligence and Machine Learning Laboratory", faculty: "Dr K Muthukannan", subjectCode: "231IT521" },
  "ES&IOT / CD LAB (R Lab)": { name: "Embedded Systems and IoT / Compiler Design Laboratory", faculty: "Ms M Aswin Rani / Ms R Chandra", subjectCode: "231CS52B / 231CS52A" },
  "PE-1 LAB (Bay 3)": { name: "Program Elective - 1 Laboratory", faculty: "Various", subjectCode: "PE-1 LAB" },
  "PE-II LAB (Bay 3)": { name: "Program Elective - II Laboratory", faculty: "Various", subjectCode: "PE-II LAB" },
  "OE-1 LAB": { name: "Open Elective-1 Laboratory", faculty: "Various", subjectCode: "OE-1 LAB" },
  "ES&IOT / CD LAB Bay3": { name: "Embedded Systems and IoT / Compiler Design Laboratory", faculty: "Ms M Aswin Rani / Ms R Chandra", subjectCode: "231CS52B / 231CS52A" },
  "SEMINAR": { name: "Standards for Engineering", faculty: "Dr. K. Muthukannan", subjectCode: "231MC56A" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. V. Nehru", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms Chandra", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IIICSEB = [
  ["AI&ML LAB (RLAB)", "AI&ML LAB (RLAB)", "LIB", "ES&IOT", "PE-II", "OE-1", "ES&IOT / CD LAB (R Lab)", "ES&IOT / CD LAB (R Lab)"], // Day I
  ["PE-1", "ES&IOT", "PPT", "PPT", "PE-1 LAB (Bay 3)", "PE-1 LAB (Bay 3)", "PE-II", "AI&ML"], // Day II
  ["AI&ML", "ES&IOT", "OE-1", "ES&IOT", "CD", "AI&ML", "SPORTS", "SPORTS"], // Day III
  ["PPT", "PPT", "OE-1 LAB", "OE-1 LAB", "PE-1", "CD", "PE-II LAB (Bay 3)", "PE-II LAB (Bay 3)"], // Day IV
  ["PE-II", "CD", "SEMINAR", "SEMINAR", "ES&IOT / CD LAB Bay3", "ES&IOT / CD LAB Bay3", "PE-1", "CD"] // Day V
];
addClassTimetable("III-CSE-B", "N205", grid_IIICSEB, sub_IIICSEB);

// ----------------------------------------------------
// PAGE 6: IIICSEC
// ----------------------------------------------------
const sub_IIICSEC: SubjectMapping = {
  "AIML": { name: "Artificial Intelligence and Machine Learning", faculty: "Ms R Kokila Priya", subjectCode: "231IT521" },
  "AI &ML": { name: "Artificial Intelligence and Machine Learning", faculty: "Ms R Kokila Priya", subjectCode: "231IT521" },
  "CD": { name: "Compiler Design", faculty: "Ms V Divya", subjectCode: "231CS521" },
  "ESIOT": { name: "Embedded Systems and IoT", faculty: "Dr. R. Saravanan", subjectCode: "231CS522" },
  "ES&IOT": { name: "Embedded Systems and IoT", faculty: "Dr. R. Saravanan", subjectCode: "231CS522" },
  "PE-1": { name: "Program Elective - 1", faculty: "Mr P Karthick / Ms S Vaitheeswari / Ms K Dhanalakshmi", subjectCode: "PE-1" },
  "PE-II": { name: "Program Elective - II", faculty: "Mr N Insozhan / Mr R Prabhakaran / Mr P Karthick", subjectCode: "PE-2" },
  "OE-1": { name: "Open Elective-1", faculty: "Ms V Lavanya / Dr K Muthukannan / Ms P Selvarathinam", subjectCode: "OE-1" },
  "CD /ES&IOT LAB BAY4": { name: "Compiler Design / Embedded Systems and IoT Laboratory", faculty: "Ms V Divya / Mrs. Chandra", subjectCode: "231CS52A / 231CS52B" },
  "AI&ML LAB BAY3": { name: "Artificial Intelligence and Machine Learning Laboratory", faculty: "Ms R Kokila Priya", subjectCode: "231IT521" },
  "PE-1 LAB (R Lab)": { name: "Program Elective - 1 Laboratory", faculty: "Various", subjectCode: "PE-1 LAB" },
  "PE-II LAB (R Lab)": { name: "Program Elective - II Laboratory", faculty: "Various", subjectCode: "PE-II LAB" },
  "OE-1 LAB": { name: "Open Elective-1 Laboratory", faculty: "Various", subjectCode: "OE-1 LAB" },
  "SEMINAR": { name: "Standards for Engineering", faculty: "Mr. P.Karthick", subjectCode: "231MC56A" },
  "SPORTS": { name: "SPORTS", faculty: "Mr. Nehru", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms R Kokila Priya", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IIICSEC = [
  ["CD /ES&IOT LAB BAY4", "CD /ES&IOT LAB BAY4", "AIML", "ESIOT", "PE-II", "OE-1", "CD", "LIB"], // Day I
  ["PE-1", "ESIOT", "PPT", "PPT", "PE-1 LAB (R Lab)", "PE-1 LAB (R Lab)", "PE-II", "AI &ML"], // Day II
  ["AI&ML LAB BAY3", "AI&ML LAB BAY3", "OE-1", "CD", "AIML", "CD", "SPORTS", "SPORTS"], // Day III
  ["PPT", "PPT", "OE-1 LAB", "OE-1 LAB", "PE-1", "ESIOT", "PE-II LAB (R Lab)", "PE-II LAB (R Lab)"], // Day IV
  ["PE-II", "ESIOT", "CD /ES&IOT LAB BAY4", "CD /ES&IOT LAB BAY4", "SEMINAR", "SEMINAR", "PE-1", "CD"] // Day V
];
addClassTimetable("III-CSE-C", "N 206", grid_IIICSEC, sub_IIICSEC);

// ----------------------------------------------------
// PAGE 7: IVCSEA
// ----------------------------------------------------
const sub_IVCSEA: SubjectMapping = {
  "PEHV": { name: "Professional Ethics and Human Values", faculty: "Dr M Buvana", subjectCode: "231HS701" },
  "SPM": { name: "Software Project Management", faculty: "Dr. B. Swaminathan", subjectCode: "231CB721" },
  "PE-V": { name: "Professional Elective - V", faculty: "Ms P Selvarathinam / Ms M K Geedtha / Dr M Victor Jose", subjectCode: "PE-V" },
  "PE-VI": { name: "Professional Elective - VI", faculty: "Dr M Victor Jose / Ms S Vaitheeshwari / Ms A Vinothini", subjectCode: "PE-VI" },
  "OE-II": { name: "Open Elective - II", faculty: "Dr. Vasantharaj S / Mr.Krishnakumar S / Ms. Annapoorani", subjectCode: "OE-II" },
  "OE-III": { name: "Open Elective - III", faculty: "Dr. R.Kalpana / New Staff / Dr. Venkata Subbiah Putta", subjectCode: "OE-III" },
  "PROJECT PHASE - 1(Bay4)": { name: "Project Phase -I", faculty: "Dr M Buvana", subjectCode: "231CS77A" },
  "PROJECT PHASE -1 (Seminar Hall)": { name: "Project Phase -I", faculty: "Dr M Buvana", subjectCode: "231CS77A" },
  "PE-V LAB(Bay 3)": { name: "Professional Elective - V Laboratory", faculty: "Various", subjectCode: "PE-V LAB" },
  "PE-VI LAB(Bay 4)": { name: "Professional Elective - VI Laboratory", faculty: "Various", subjectCode: "PE-VI LAB" },
  "OE-III LAB(Bay 3)": { name: "Open Elective - III Laboratory", faculty: "Various", subjectCode: "OE-III LAB" },
  "SPORTS": { name: "SPORTS", faculty: "Mr N Insozhan", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms M K Geedtha", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IVCSEA = [
  ["OE-II", "PEHV", "PE-V", "SPM", "PE-VI", "SPM", "OE-III LAB(Bay 3)", "OE-III LAB(Bay 3)"], // Day I
  ["PROJECT PHASE - 1(Bay4)", "PROJECT PHASE - 1(Bay4)", "OE-II", "SPM", "OE-III", "PEHV", "PPT", "PE-V"], // Day II
  ["PE-VI", "PEHV", "PE-VI LAB(Bay 4)", "PE-VI LAB(Bay 4)", "OE-II", "PEHV", "SPORTS", "SPORTS"], // Day III
  ["PE-V LAB(Bay 3)", "PE-V LAB(Bay 3)", "PE-VI", "LIB", "OE-III", "SPM", "OE-II", "PPT"], // Day IV
  ["PEHV", "PPT", "OE-III", "PE-V", "OE-II", "SPM", "PROJECT PHASE -1 (Seminar Hall)", "PROJECT PHASE -1 (Seminar Hall)"] // Day V
];
addClassTimetable("IV-CSE-A", "I 305", grid_IVCSEA, sub_IVCSEA);

// ----------------------------------------------------
// PAGE 8: IVCSEB
// ----------------------------------------------------
const sub_IVCSEB: SubjectMapping = {
  "PEHV": { name: "Professional Ethics and Human Values", faculty: "Ms J Bebitha", subjectCode: "231HS701" },
  "SPM": { name: "Software Project Management", faculty: "Dr E Mercy Beullah", subjectCode: "231CB721" },
  "PE-V": { name: "Professional Elective - V", faculty: "Ms P Selvarathinam / Ms M K Geedtha / Dr M Victor Jose", subjectCode: "PE-V" },
  "PE-VI": { name: "Professional Elective - VI", faculty: "Dr M Victor Jose / Ms S Vaitheeshwari / Ms A Vinothini", subjectCode: "PE-VI" },
  "OE-II": { name: "Open Elective - II", faculty: "Dr. Vasantharaj S / Mr.Krishnakumar S / Ms. Annapoorani", subjectCode: "OE-II" },
  "OE-III": { name: "Open Elective - III", faculty: "Dr. R.Kalpana / New Staff / Dr. Venkata Subbiah Putta", subjectCode: "OE-III" },
  "PROJECT PHASE - 1(Seminar Hall)": { name: "Project Phase -I", faculty: "Mr S Vinod", subjectCode: "231CS77A" },
  "PROJECT PHASE - 1(Bay 3)": { name: "Project Phase -I", faculty: "Mr S Vinod", subjectCode: "231CS77A" },
  "PE-V LAB": { name: "Professional Elective - V Laboratory", faculty: "Various", subjectCode: "PE-V LAB" },
  "PE-VI LAB (Bay 3)": { name: "Professional Elective - VI Laboratory", faculty: "Various", subjectCode: "PE-VI LAB" },
  "OE-III LAB(Class Room)": { name: "Open Elective - III Laboratory", faculty: "Various", subjectCode: "OE-III LAB" },
  "SPORTS": { name: "SPORTS", faculty: "Mr N Insozhan", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms S Vaitheeshwari", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IVCSEB = [
  ["OE-II", "PEHV", "PE-V", "SPM", "PE-VI", "PEHV", "OE-III LAB(Class Room)", "OE-III LAB(Class Room)"], // Day I
  ["PROJECT PHASE - 1(Seminar Hall)", "PROJECT PHASE - 1(Seminar Hall)", "OE-II", "PEHV", "OE-III", "SPM", "PPT", "PE-V"], // Day II
  ["PE-VI", "SPM", "PE-VI LAB (Bay 3)", "PE-VI LAB (Bay 3)", "OE-II", "PEHV", "SPORTS", "SPORTS"], // Day III
  ["PE-V LAB", "PE-V LAB", "PE-VI", "SPM", "OE-III", "PPT", "OE-II", "LIB"], // Day IV
  ["SPM", "PPT", "OE-III", "PE-V", "OE-II", "PEHV", "PROJECT PHASE - 1(Bay 3)", "PROJECT PHASE - 1(Bay 3)"] // Day V
];
addClassTimetable("IV-CSE-B", "I 306", grid_IVCSEB, sub_IVCSEB);

// ----------------------------------------------------
// PAGE 9: IVCSEC
// ----------------------------------------------------
const sub_IVCSEC: SubjectMapping = {
  "PEHV": { name: "Professional Ethics and Human Values", faculty: "Ms M Aswin Rani", subjectCode: "231HS701" },
  "SPM": { name: "Software Project Management", faculty: "Ms M.K. Geedtha", subjectCode: "231CB721" },
  "PE-V": { name: "Professional Elective - V", faculty: "Ms P Selvarathinam / Ms M K Geedtha / Dr M Victor Jose", subjectCode: "PE-V" },
  "PE-VI": { name: "Professional Elective - VI", faculty: "Dr M Victor Jose / Ms S Vaitheeshwari / Ms A Vinothini", subjectCode: "PE-VI" },
  "OE-II": { name: "Open Elective - II", faculty: "Dr. Vasantharaj S / Mr.Krishnakumar S / Ms. Annapoorani", subjectCode: "OE-II" },
  "OE-III": { name: "Open Elective - III", faculty: "Dr. R.Kalpana / New Staff / Dr. Venkata Subbiah Putta", subjectCode: "OE-III" },
  "PROJECT PHASE - 1(Class Room)": { name: "Project Phase -I", faculty: "Dr. E. Mercy Beulah", subjectCode: "231CS77A" },
  "PROJECT PHASE 1 (Bay3 Lab)": { name: "Project Phase -I", faculty: "Dr. E. Mercy Beulah", subjectCode: "231CS77A" },
  "PE-V LAB (Bay 4)": { name: "Professional Elective - V Laboratory", faculty: "Various", subjectCode: "PE-V LAB" },
  "PE-V LAB(Bay 4)": { name: "Professional Elective - V Laboratory", faculty: "Various", subjectCode: "PE-V LAB" },
  "PE-VI LAB (Research Lab)": { name: "Professional Elective - VI Laboratory", faculty: "Various", subjectCode: "PE-VI LAB" },
  "OE-III LAB (Class Room)": { name: "Open Elective - III Laboratory", faculty: "Various", subjectCode: "OE-III LAB" },
  "SPORTS": { name: "SPORTS", faculty: "Mr N Insozhan", subjectCode: "SPORTS" },
  "LIB": { name: "LIBRARY", faculty: "Ms P Selvarathinam", subjectCode: "LIBRARY" },
  "PPT": { name: "PPT", faculty: "Placement Trainer", subjectCode: "PPT" }
};
const grid_IVCSEC = [
  ["OE-II", "PEHV", "PE-V", "PPT", "PE-VI", "SPM", "OE-III LAB (Class Room)", "OE-III LAB (Class Room)"], // Day I
  ["PROJECT PHASE - 1(Class Room)", "PROJECT PHASE - 1(Class Room)", "OE-II", "SPM", "OE-III", "PEHV", "PPT", "PE-V"], // Day II
  ["PE-VI", "SPM", "PE-VI LAB (Research Lab)", "PE-VI LAB (Research Lab)", "OE-II", "PEHV", "SPORTS", "SPORTS"], // Day III
  ["PE-V LAB (Bay 4)", "PE-V LAB (Bay 4)", "PE-VI", "PEHV", "OE-III", "SPM", "OE-II", "PPT"], // Day IV
  ["PROJECT PHASE 1 (Bay3 Lab)", "PROJECT PHASE 1 (Bay3 Lab)", "OE-III", "PE-V", "OE-II", "LIB", "SPM", "PEHV"] // Day V
];
addClassTimetable("IV-CSE-C", "J 301", grid_IVCSEC, sub_IVCSEC);


// Main Seeding execution
async function main() {
  console.log('Starting timetable seeding...');
  
  // Clear existing table data
  console.log('Deleting all existing TimetableEntry data...');
  await prisma.timetableEntry.deleteMany({});
  console.log('Deleted existing data.');

  console.log(`Inserting ${timetables.length} timetable entries...`);
  await prisma.timetableEntry.createMany({
    data: timetables
  });
  console.log('Timetable entries inserted successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
