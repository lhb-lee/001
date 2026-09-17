import { Student } from '../types';

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'sample-1', name: '陳冠宇', studentNumber: '01' },
  { id: 'sample-2', name: '林子晴', studentNumber: '02' },
  { id: 'sample-3', name: '黃俊傑', studentNumber: '03' },
  { id: 'sample-4', name: '張雅筑', studentNumber: '04' },
  { id: 'sample-5', name: '李承翰', studentNumber: '05' },
  { id: 'sample-6', name: '吳佩蓉', studentNumber: '06' },
  { id: 'sample-7', name: '王柏安', studentNumber: '07' },
  { id: 'sample-8', name: '蔡欣妤', studentNumber: '08' },
  { id: 'sample-9', name: '劉建廷', studentNumber: '09' },
  { id: 'sample-10', name: '楊雨桐', studentNumber: '10' },
  { id: 'sample-11', name: '許家瑋', studentNumber: '11' },
  { id: 'sample-12', name: '鄭婷婷', studentNumber: '12' },
  { id: 'sample-13', name: '謝育誠', studentNumber: '13' },
  { id: 'sample-14', name: '洪語婕', studentNumber: '14' },
  { id: 'sample-15', name: '郭宥廷', studentNumber: '15' },
  { id: 'sample-16', name: '邱巧玲', studentNumber: '16' },
  { id: 'sample-17', name: '曾品叡', studentNumber: '17' },
  { id: 'sample-18', name: '廖思涵', studentNumber: '18' },
  { id: 'sample-19', name: '賴彥廷', studentNumber: '19' },
  { id: 'sample-20', name: '周佳穎', studentNumber: '20' },
  { id: 'sample-21', name: '徐宇軒', studentNumber: '21' },
  { id: 'sample-22', name: '蘇靖雯', studentNumber: '22' },
  { id: 'sample-23', name: '葉哲瑋', studentNumber: '23' },
  { id: 'sample-24', name: '莊詠晴', studentNumber: '24' },
  { id: 'sample-25', name: '江宏明', studentNumber: '25' },
  { id: 'sample-26', name: '何郁婷', studentNumber: '26' },
  { id: 'sample-27', name: '羅啟銘', studentNumber: '27' },
  { id: 'sample-28', name: '高語萱', studentNumber: '28' },
  { id: 'sample-29', name: '蕭俊宏', studentNumber: '29' },
  { id: 'sample-30', name: '潘怡萱', studentNumber: '30' },
];

/**
 * Remove UTF-8 BOM if present
 */
function cleanBOM(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Parses raw text or CSV content into Student[]
 */
export function parseStudentInput(rawContent: string): { students: Student[]; warnings: string[] } {
  const content = cleanBOM(rawContent).trim();
  const warnings: string[] = [];

  if (!content) {
    return { students: [], warnings: ['輸入內容為空'] };
  }

  // Split by line breaks (CRLF or LF)
  const lines = content.split(/\r\n|\n|\r/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    return { students: [], warnings: ['找不到任何有效行數'] };
  }

  // Detect delimiter in lines
  let hasComma = false;
  let hasTab = false;
  let hasSemicolon = false;

  for (const line of lines.slice(0, 10)) {
    if (line.includes(',')) hasComma = true;
    if (line.includes('\t')) hasTab = true;
    if (line.includes(';')) hasSemicolon = true;
  }

  const delimiter = hasTab ? '\t' : hasComma ? ',' : hasSemicolon ? ';' : null;

  let startIndex = 0;
  let nameColIdx = -1;
  let numColIdx = -1;

  // Check if first row is a header
  if (lines.length > 1 && delimiter) {
    const firstRowCols = splitLine(lines[0], delimiter).map((c) => c.trim().toLowerCase());
    const headerKeywords = ['name', '姓名', '學生姓名', '學生', 'student', '名字'];
    const numberKeywords = ['no', 'id', '學號', '座號', '編號', 'number', '#'];

    firstRowCols.forEach((col, idx) => {
      if (headerKeywords.some((kw) => col.includes(kw))) {
        nameColIdx = idx;
      }
      if (numberKeywords.some((kw) => col.includes(kw))) {
        numColIdx = idx;
      }
    });

    if (nameColIdx !== -1 || numColIdx !== -1) {
      startIndex = 1; // Skip header
    }
  }

  const parsedStudents: Student[] = [];
  const seenKeys = new Set<string>();

  for (let i = startIndex; i < lines.length; i++) {
    const rawLine = lines[i];
    if (!rawLine) continue;

    let extractedName = '';
    let extractedNumber = '';

    if (delimiter) {
      const parts = splitLine(rawLine, delimiter).map((p) => p.trim());
      if (parts.length === 1) {
        extractedName = parts[0];
      } else if (nameColIdx !== -1 && parts[nameColIdx]) {
        extractedName = parts[nameColIdx];
        if (numColIdx !== -1 && parts[numColIdx]) {
          extractedNumber = parts[numColIdx];
        } else {
          // If first col looks like a number and second is name
          const otherPart = parts.find((_, idx) => idx !== nameColIdx) || '';
          if (/^#?\d+$/.test(otherPart)) {
            extractedNumber = otherPart;
          }
        }
      } else {
        // Guess column: if first is digits/id and second is name
        if (/^#?\d+$/.test(parts[0]) && parts[1]) {
          extractedNumber = parts[0].replace(/^#/, '');
          extractedName = parts[1];
        } else {
          extractedName = parts[0];
          if (parts[1] && !extractedNumber) {
            extractedNumber = parts[1];
          }
        }
      }
    } else {
      // Plain text line: could be "1. 王小明", "01 林美麗", "張三 102", "李四"
      const numberedPrefixMatch = rawLine.match(/^(\d+)[\.\s、\-]+(.+)$/);
      if (numberedPrefixMatch) {
        extractedNumber = numberedPrefixMatch[1];
        extractedName = numberedPrefixMatch[2].trim();
      } else {
        // Space separated
        const spaceParts = rawLine.split(/\s+/);
        if (spaceParts.length >= 2) {
          if (/^#?\d+$/.test(spaceParts[0])) {
            extractedNumber = spaceParts[0].replace(/^#/, '');
            extractedName = spaceParts.slice(1).join(' ');
          } else if (/^#?\d+$/.test(spaceParts[spaceParts.length - 1])) {
            extractedNumber = spaceParts[spaceParts.length - 1].replace(/^#/, '');
            extractedName = spaceParts.slice(0, -1).join(' ');
          } else {
            // Take entire line as student name
            extractedName = rawLine;
          }
        } else {
          extractedName = rawLine;
        }
      }
    }

    // Clean up quotes
    extractedName = extractedName.replace(/^["']|["']$/g, '').trim();
    extractedNumber = extractedNumber.replace(/^["']|["']$/g, '').trim();

    if (extractedName && extractedName.length > 0) {
      // Deduplicate key
      const key = `${extractedNumber ? extractedNumber + '_' : ''}${extractedName}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        parsedStudents.push({
          id: `stu-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          name: extractedName,
          studentNumber: extractedNumber || undefined,
        });
      }
    }
  }

  if (parsedStudents.length === 0) {
    warnings.push('未能成功辨識出任何學生姓名，請檢查格式');
  }

  return { students: parsedStudents, warnings };
}

/**
 * Splits CSV line respecting quotes
 */
function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/**
 * Exports students to CSV string
 */
export function exportToCSV(students: Student[]): string {
  const hasNumbers = students.some((s) => !!s.studentNumber);
  const rows: string[] = [];

  if (hasNumbers) {
    rows.push('座號,姓名');
    students.forEach((s) => {
      rows.push(`"${s.studentNumber || ''}","${s.name.replace(/"/g, '""')}"`);
    });
  } else {
    rows.push('姓名');
    students.forEach((s) => {
      rows.push(`"${s.name.replace(/"/g, '""')}"`);
    });
  }

  return '\uFEFF' + rows.join('\r\n'); // Add UTF-8 BOM so Excel opens with proper Chinese encoding
}
