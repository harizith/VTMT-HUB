const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CANONICAL_MAP = {
  "Dr E Mercy Beullah": { name: "Dr Mercy Beulah E", vmNo: "2103" },
  "Dr. E. Mercy Beulah": { name: "Dr Mercy Beulah E", vmNo: "2103" },
  "Dr. E. Mercy Beullah": { name: "Dr Mercy Beulah E", vmNo: "2103" },
  "Dr K Muthukannan": { name: "Dr Muthukannan K", vmNo: "2236" },
  "Dr. K. Muthukannan": { name: "Dr Muthukannan K", vmNo: "2236" },
  "Dr M Buvana": { name: "Dr Buvana M", vmNo: "2224" },
  "Dr. M. Swaminathan": { name: "Dr. B. Swaminathan", vmNo: "2315" },
  "Dr. M. Victor Jose": { name: "Dr Victor Jose M", vmNo: "2014" },
  "Dr. R. Saravanan": { name: "Dr Saravanan R", vmNo: "1944" },
  "Mr C Pandi": { name: "Mr Pandi C", vmNo: "2002" },
  "Mr N Insozhan": { name: "Dr.Insozhan.N", vmNo: "1069" },
  "Mr P Karthick": { name: "Mr Karthick P", vmNo: "2034" },
  "Mr R Harini": { name: "Ms Harini R", vmNo: "1958" },
  "Ms. R. Harini": { name: "Ms Harini R", vmNo: "1958" },
  "Mr V Nehru": { name: "Dr. NehruV", vmNo: "1853" },
  "Mr. V. Nehru": { name: "Dr. NehruV", vmNo: "1853" },
  "Mr. P. Sathish Kumar": { name: "Mr Sathish Kumar P", vmNo: "1651" },
  "Mr. Sathish Kumar": { name: "Mr Sathish Kumar P", vmNo: "1651" },
  "Ms A Vinothini": { name: "Ms Vinothini A", vmNo: "1947" },
  "Ms D Parkavi": { name: "Ms Parkavi D", vmNo: "1948" },
  "Ms. D. Parkavi": { name: "Ms Parkavi D", vmNo: "1948" },
  "Ms J Bebitha": { name: "Ms Bebitha J", vmNo: "2106" },
  "Ms. J. Bebitha": { name: "Ms Bebitha J", vmNo: "2106" },
  "Ms M Aswin Rani": { name: "Ms Aswin Rani M", vmNo: "2065" },
  "Ms M K Geedtha": { name: "Ms Geedtha M K", vmNo: "2238" },
  "Ms M.K. Geedtha": { name: "Ms Geedtha M K", vmNo: "2238" },
  "Ms P Selvarathinam": { name: "Ms Selva Rathinam P", vmNo: "2052" },
  "Ms R Chandra": { name: "Ms Chandra Rajesh", vmNo: "2228" },
  "Ms R Kokila Priya": { name: "Ms Kokilapriya R", vmNo: "2105" },
  "Ms. R. Kokila Priya": { name: "Ms Kokilapriya R", vmNo: "2105" },
  "Ms. R.Kokila Priya": { name: "Ms Kokilapriya R", vmNo: "2105" },
  "Ms S. Alfiya": { name: "Ms Alfiya S", vmNo: "2223" },
  "Ms. S.Alfiya": { name: "Ms Alfiya S", vmNo: "2223" },
  "Ms V Divya": { name: "Ms Divya V", vmNo: "2000" },
  "Ms V Vijayashanthi": { name: "Ms Vijayashanthi V", vmNo: "1950" },
  "Ms. Sandhiya Sree": { name: "Ms.C S Sandhya Sri", vmNo: "2284" },
  "Ms. Yerakkamma": { name: "Ms.Yerakamma", vmNo: "2287" },
  "Ms.Yerakkamma": { name: "Ms.Yerakamma", vmNo: "2287" }
};

const LAB_MAP = {
  // II-CSE-A
  "II-CSE-A|231CS32A": { faculty: "Ms Vinothini A, Ms Dhanalakshmi K, Mr Pandi C", vmsNo: "1947, 2017, 2002" },
  "II-CSE-A|231CS325": { faculty: "Ms.Yerakamma, Ms Lavanya V, Dr Stalin David D", vmsNo: "2287, 2016, 2170" },
  "II-CSE-A|231CS32B": { faculty: "Ms.C S Sandhya Sri, Mr Vinod S, Dr.Vijay.R", vmsNo: "2284, 948, 2317" },
  "II-CSE-A|231MA302": { faculty: "Dr. Mattuvarkuzhali, Ms.R.Gayathri, Ms Vaitheeshwari S", vmsNo: "2323, 2003" },

  // II-CSE-B
  "II-CSE-B|231MA302": { faculty: "Ms. Anurathi, Ms.R.Gayathri, Mr Venkatesan P", vmsNo: "2323, 1454" },
  "II-CSE-B|231CS32B": { faculty: "Dr. NehruV, Mr Vinod S, Ms Vinothini V", vmsNo: "1853, 948, 2071" },
  "II-CSE-B|231CS325": { faculty: "Ms Divya V, Ms Lavanya V, Ms.Yerakamma", vmsNo: "2000, 2016, 2287" },
  "II-CSE-B|231CS32A": { faculty: "Ms Parkavi D, Ms Dhanalakshmi K, Mr Pandi C", vmsNo: "1948, 2017, 2002" },

  // II-CSE-C
  "II-CSE-C|231CS32A": { faculty: "Dr Mercy Beulah E, Ms Dhanalakshmi K, Mr Venkatesan P", vmsNo: "2103, 2017, 1454" },
  "II-CSE-C|231CS325": { faculty: "Ms Parkavi D, Ms Vaitheeshwari S, Dr Stalin David D", vmsNo: "1948, 2003, 2170" },
  "II-CSE-C|231CS32B": { faculty: "Ms Harini R, Mr Vinod S, Ms.C S Sandhya Sri", vmsNo: "1958, 948, 2284" },
  "II-CSE-C|231MA302": { faculty: "Dr. T. Mary Shalini, Ms.R.Gayathri, Ms. Anurathi", vmsNo: "2323" },

  // III-CSE-A
  "III-CSE-A|231CS52A": { faculty: "Dr. NehruV, Ms Vijayashanthi V, Dr.Insozhan.N", vmsNo: "1853, 1950, 1069" },
  "III-CSE-A|231CSV44": { faculty: "Mr Karthick P, Dr.Vijay.R, Mr Pandi C", vmsNo: "2034, 2317, 2002" },
  "III-CSE-A|231ITV64": { faculty: "Dr.Insozhan.N, Mr Venkatesan P, Ms Vinothini V", vmsNo: "1069, 1454, 2071" },
  "III-CSE-A|231IT521": { faculty: "Ms Harini R, Dr Muthukannan K, Ms Kokilapriya R", vmsNo: "1958, 2236, 2105" },
  "III-CSE-A|231ECV22": { faculty: "Faculty Coordinator, Ms Vinothini V, Ms Lavanya V", vmsNo: "2071, 2016" },

  // III-CSE-B
  "III-CSE-B|231IT521": { faculty: "Dr Muthukannan K, Ms Kokilapriya R, Ms Harini R", vmsNo: "2236, 2105, 1958" },
  "III-CSE-B|231CS52A": { faculty: "Ms Aswin Rani M, Dr. NehruV, Ms Chandra Rajesh", vmsNo: "2065, 1853, 2228" },
  "III-CSE-B|231CSV44": { faculty: "Mr Karthick P, Dr.Vijay.R, Mr Pandi C", vmsNo: "2034, 2317, 2002" },
  "III-CSE-B|231ITV64": { faculty: "Dr.Insozhan.N, Mr Venkatesan P, Ms Vinothini V", vmsNo: "1069, 1454, 2071" },
  "III-CSE-B|231ECV22": { faculty: "Faculty Coordinator, Ms Vinothini V, Ms Lavanya V", vmsNo: "2071, 2016" },

  // III-CSE-C
  "III-CSE-C|231CS52A": { faculty: "Dr Saravanan R, Dr. NehruV, Ms Divya V", vmsNo: "1944, 1853, 2000" },
  "III-CSE-C|231CSV44": { faculty: "Mr Karthick P, Dr.Vijay.R, Mr Pandi C", vmsNo: "2034, 2317, 2002" },
  "III-CSE-C|231IT521": { faculty: "Ms Kokilapriya R, Dr Muthukannan K, Ms Harini R", vmsNo: "2105, 2236, 1958" },
  "III-CSE-C|231ITV64": { faculty: "Dr.Insozhan.N, Mr Venkatesan P, Ms Vinothini V", vmsNo: "1069, 1454, 2071" },
  "III-CSE-C|231ECV22": { faculty: "Faculty Coordinator, Ms Vinothini V, Ms Lavanya V", vmsNo: "2071, 2016" },

  // IV-CSE-A
  "IV-CSE-A|231ECV37": { faculty: "Faculty Coordinator, Ms Dhanalakshmi K, Ms Vaitheeshwari S", vmsNo: "2017, 2003" },
  "IV-CSE-A|231ITV51": { faculty: "Dr. B. Swaminathan, Dr Buvana M, Ms Bebitha J", vmsNo: "2315, 2224, 2106" },
  "IV-CSE-A|231CSV46": { faculty: "Dr Victor Jose M, Ms Selva Rathinam P, Ms Geedtha M K", vmsNo: "2014, 2052, 2238" },
  "IV-CSE-A|231CS77A": { faculty: "Dr Victor Jose M, Dr Stalin David D, Mr Sathish Kumar P", vmsNo: "2014, 2170, 1651" },

  // IV-CSE-B
  "IV-CSE-B|231ECV37": { faculty: "Faculty Coordinator, Ms Dhanalakshmi K, Ms Vaitheeshwari S", vmsNo: "2017, 2003" },
  "IV-CSE-B|231ITV51": { faculty: "Dr. B. Swaminathan, Dr Buvana M, Ms Bebitha J", vmsNo: "2315, 2224, 2106" },
  "IV-CSE-B|231CSV46": { faculty: "Ms Selva Rathinam P, Dr Victor Jose M, Ms Geedtha M K", vmsNo: "2052, 2014, 2238" },
  "IV-CSE-B|231CS77A": { faculty: "Dr Mercy Beulah E, Dr Buvana M, Mr Sathish Kumar P", vmsNo: "2103, 2224, 1651" },

  // IV-CSE-C
  "IV-CSE-C|231ECV37": { faculty: "Faculty Coordinator, Ms Dhanalakshmi K, Ms Vaitheeshwari S", vmsNo: "2017, 2003" },
  "IV-CSE-C|231ITV51": { faculty: "Dr. B. Swaminathan, Dr Buvana M, Ms Bebitha J", vmsNo: "2315, 2224, 2106" },
  "IV-CSE-C|231CSV46": { faculty: "Ms Geedtha M K, Ms Selva Rathinam P, Dr Victor Jose M", vmsNo: "2238, 2052, 2014" },
  "IV-CSE-C|231CS77A": { faculty: "Dr Saravanan R, Dr. B. Swaminathan, Mr Sathish Kumar P", vmsNo: "1944, 2315, 1651" },
};

async function main() {
  console.log("1. Updating canonical faculty names across all classes...");
  for (const [rawName, canon] of Object.entries(CANONICAL_MAP)) {
    const res = await prisma.timetableEntry.updateMany({
      where: { facultyName: rawName },
      data: { facultyName: canon.name, vmsNo: canon.vmNo }
    });
    if (res.count > 0) {
      console.log(` - Normalized "${rawName}" -> "${canon.name}" (${res.count} slots)`);
    }
  }

  console.log("\n2. Updating Laboratory hours with 2-3 faculty members...");
  for (const [key, labData] of Object.entries(LAB_MAP)) {
    const [classId, subjectCode] = key.split('|');
    const res = await prisma.timetableEntry.updateMany({
      where: { classId, subjectCode },
      data: { facultyName: labData.faculty, vmsNo: labData.vmsNo }
    });
    if (res.count > 0) {
      console.log(` - [${classId}] ${subjectCode} -> Staff: ${labData.faculty} (${res.count} slots)`);
    }
  }

  console.log("\n3. Verifying updated distinct faculty count...");
  const distinct = await prisma.timetableEntry.findMany({
    select: { facultyName: true, vmsNo: true },
    distinct: ['facultyName'],
    orderBy: { facultyName: 'asc' }
  });
  console.log(`Total unique faculty entries in timetable: ${distinct.length}`);
  distinct.forEach(d => console.log(`   * ${d.facultyName} (${d.vmsNo || 'N/A'})`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
