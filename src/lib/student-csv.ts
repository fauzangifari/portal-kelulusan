export type StudentStatus = "LULUS" | "TIDAK LULUS";

export type StudentCsvRecord = {
  nisn: string;
  nama: string;
  status: StudentStatus;
  tanggalLahir: string;
};

export class CsvValidationError extends Error {}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return false;
  }
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

export function parseStudentsCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    throw new CsvValidationError("CSV minimal harus memiliki 1 header dan 1 baris data.");
  }

  const header = lines[0].split(",").map((item) => item.trim().toLowerCase());
  const expected = ["nisn", "nama", "status", "tanggallahir"];

  // Flexible header check
  const hasRequiredHeaders = expected.every(h => header.includes(h));

  if (!hasRequiredHeaders) {
    throw new CsvValidationError(
      "Header CSV tidak valid. Pastikan kolom berikut ada: nisn, nama, status, tanggalLahir"
    );
  }

  const nisnIdx = header.indexOf("nisn");
  const namaIdx = header.indexOf("nama");
  const statusIdx = header.indexOf("status");
  const tglIdx = header.indexOf("tanggallahir");

  const records: StudentCsvRecord[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].split(",").map((item) => item.trim());
    
    if (row.length < expected.length) {
      throw new CsvValidationError(`Baris ${i + 1}: Jumlah kolom tidak mencukupi.`);
    }

    const nisn = row[nisnIdx].replace(/['"]/g, ""); // Remove quotes if any
    const nama = row[namaIdx].toUpperCase();
    const statusRaw = row[statusIdx].toUpperCase();
    const tanggalLahir = row[tglIdx];

    if (!/^\d{10}$/.test(nisn)) {
      throw new CsvValidationError(`Baris ${i + 1}: NISN [${nisn}] harus 10 digit angka.`);
    }

    if (!nama) {
      throw new CsvValidationError(`Baris ${i + 1}: Nama tidak boleh kosong.`);
    }

    const status = statusRaw === "LULUS" ? "LULUS" : "TIDAK LULUS";
    
    if (!isValidDateString(tanggalLahir)) {
      throw new CsvValidationError(
        `Baris ${i + 1}: Format Tanggal Lahir [${tanggalLahir}] tidak valid. Gunakan YYYY-MM-DD.`
      );
    }

    records.push({
      nisn,
      nama,
      status: status as StudentStatus,
      tanggalLahir,
    });
  }

  return records;
}
