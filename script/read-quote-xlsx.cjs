const XLSX = require("xlsx");
const fs = require("fs");

const filePath = process.argv[2] || "c:\\Users\\Kemar\\Downloads\\rep quote fixed.xlsx";
if (!fs.existsSync(filePath)) {
  console.error("File not found:", filePath);
  process.exit(1);
}

const workbook = XLSX.readFile(filePath, { cellFormulas: true, cellStyles: false });
console.log("=== SHEET NAMES ===");
console.log(workbook.SheetNames.join("\n"));

for (const sheetName of workbook.SheetNames) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) continue;
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  console.log("\n=== SHEET:", sheetName, "===");
  console.log("Range:", sheet["!ref"]);
  const out = [];
  for (let R = range.s.r; R <= Math.min(range.e.r, range.s.r + 80); R++) {
    const row = [];
    for (let C = range.s.c; C <= Math.min(range.e.c, range.s.c + 30); C++) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = sheet[addr];
      if (!cell) {
        row.push("");
        continue;
      }
      let v = cell.v;
      if (cell.f) v = `[FORMULA: ${cell.f}]`;
      else if (v === undefined && cell.t === "s") v = "(shared string)";
      row.push(String(v ?? ""));
    }
    out.push(row.join("\t"));
  }
  console.log(out.join("\n"));
}
