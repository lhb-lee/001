import React, { useState, useRef } from 'react';
import {
  Upload,
  ClipboardPaste,
  Trash2,
  Plus,
  FileSpreadsheet,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { Student } from '../types';
import { parseStudentInput, exportToCSV, SAMPLE_STUDENTS } from '../utils/csvParser';

interface RosterManagerProps {
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
  onGoToPicker: () => void;
  onGoToGrouping: () => void;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  students,
  onUpdateStudents,
  onGoToPicker,
  onGoToGrouping,
}) => {
  const [activeInputTab, setActiveInputTab] = useState<'upload' | 'paste'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleNumber, setSingleNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotice({ type, message });
    setTimeout(() => setNotice(null), 4000);
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        showNotice('檔案內容為空', 'error');
        return;
      }
      const { students: parsed, warnings } = parseStudentInput(content);
      if (parsed.length > 0) {
        onUpdateStudents(parsed);
        showNotice(`成功匯入 ${parsed.length} 位學生名單！`);
      } else {
        showNotice(warnings[0] || '無法讀取名單，請確認檔案格式', 'error');
      }
    };
    reader.onerror = () => {
      showNotice('檔案讀取失敗，請重新嘗試', 'error');
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // reset input so same file can be chosen again if modified
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      showNotice('請貼上或輸入學生姓名', 'error');
      return;
    }
    const { students: parsed, warnings } = parseStudentInput(pastedText);
    if (parsed.length > 0) {
      onUpdateStudents(parsed);
      setPastedText('');
      showNotice(`成功貼上匯入 ${parsed.length} 位學生名單！`);
    } else {
      showNotice(warnings[0] || '未能解析出學生姓名', 'error');
    }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = singleName.trim();
    if (!trimmed) return;

    const newStudent: Student = {
      id: `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      studentNumber: singleNumber.trim() || undefined,
    };

    onUpdateStudents([...students, newStudent]);
    setSingleName('');
    setSingleNumber('');
    showNotice(`已新增學生：${trimmed}`);
  };

  const handleRemoveStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    onUpdateStudents(students.filter((s) => s.id !== id));
    if (target) {
      showNotice(`已移除學生：${target.name}`);
    }
  };

  const handleClearAll = () => {
    if (students.length === 0) return;
    if (window.confirm(`確定要清空全班共 ${students.length} 位學生名單嗎？`)) {
      onUpdateStudents([]);
      showNotice('已清空學生名單');
    }
  };

  const handleLoadSample = () => {
    onUpdateStudents(SAMPLE_STUDENTS);
    showNotice(`已載入示範班級名單（共 ${SAMPLE_STUDENTS.length} 人）！`);
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      showNotice('名單為空，無法匯出', 'error');
      return;
    }
    const csvData = exportToCSV(students);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotice('已成功匯出 CSV 檔案');
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentNumber && s.studentNumber.includes(searchTerm))
  );

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {notice && (
        <div
          className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium transition-all ${
            notice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Top Banner / Welcome info */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>第一步：設定學生名單來源</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white mb-2">
            上傳 CSV 或貼上姓名，建立您的班級名單
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed mb-4">
            名單建立後，即可隨時使用
            <strong className="text-indigo-300 font-semibold">「隨機抽籤點名」</strong>
            （伴隨音效與翻牌動畫）或
            <strong className="text-indigo-300 font-semibold">「自動分組功能」</strong>
            （自訂每組人數並以彩色卡片視覺化呈現）。
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={handleLoadSample}
              className="inline-flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>載入 30 人範例名單試用</span>
            </button>
            {students.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={onGoToPicker}
                  className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
                >
                  <span>前往隨機抽籤</span>
                  <span>→</span>
                </button>
                <button
                  onClick={onGoToGrouping}
                  className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition shadow-xs"
                >
                  <span>前往自動分組</span>
                  <span>→</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Subtle decorative geometry */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center">
          <FileSpreadsheet className="w-64 h-64 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input source column (Upload CSV or Paste) */}
        <div className="lg:col-span-6 space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            {/* Input Method Switcher */}
            <div className="flex border-b border-slate-200 mb-5 pb-2 gap-2">
              <button
                id="source-upload-tab"
                onClick={() => setActiveInputTab('upload')}
                className={`flex items-center gap-2 pb-2 px-3 text-sm font-semibold border-b-2 -mb-2.5 transition-all ${
                  activeInputTab === 'upload'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>上傳 CSV / 檔案</span>
              </button>
              <button
                id="source-paste-tab"
                onClick={() => setActiveInputTab('paste')}
                className={`flex items-center gap-2 pb-2 px-3 text-sm font-semibold border-b-2 -mb-2.5 transition-all ${
                  activeInputTab === 'paste'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>貼上學生名單</span>
              </button>
            </div>

            {/* TAB 1: CSV Upload */}
            {activeInputTab === 'upload' && (
              <div className="space-y-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.txt,.tsv"
                  className="hidden"
                  id="csv-file-input"
                />

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                      : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    點擊選擇檔案，或直接拖曳檔案至此處
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    支援 CSV、TXT、TSV 格式（可包含「座號」與「姓名」欄位）
                  </p>
                  <button
                    type="button"
                    className="mt-4 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                  >
                    瀏覽檔案
                  </button>
                </div>

                {/* CSV Instructions helper */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                  <div className="flex items-center gap-1 font-semibold text-slate-700">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
                    <span>CSV 格式支援說明：</span>
                  </div>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Excel 匯出的 UTF-8 CSV 繁體中文名單已自動相容（支援 BOM 標記）</li>
                    <li>
                      欄位格式範例：<code className="bg-slate-200 px-1 py-0.5 rounded">姓名</code>{' '}
                      或{' '}
                      <code className="bg-slate-200 px-1 py-0.5 rounded">座號,姓名</code>
                    </li>
                    <li>純文字每行一個名字亦可直接上傳</li>
                  </ul>
                </div>
              </div>
            )}

            {/* TAB 2: Paste List */}
            {activeInputTab === 'paste' && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="paste-students-textarea"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    請在下方貼上姓名名單（每行一位，或以逗號/空格隔開）：
                  </label>
                  <textarea
                    id="paste-students-textarea"
                    rows={7}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="例如：&#10;01 陳冠宇&#10;02 林子晴&#10;03 黃俊傑&#10;04 張雅筑&#10;（或直接貼上：王小明, 李小華, 張大千...）"
                    className="w-full text-sm font-mono p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-hidden bg-slate-50/50"
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    支援「1. 王小明」或「01 王小明」等帶序號格式
                  </span>
                  <button
                    type="button"
                    onClick={handlePasteSubmit}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition flex items-center gap-1.5"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                    <span>匯入名單</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Add Single Student Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>快速手動新增單一學生</span>
            </h3>
            <form onSubmit={handleAddSingleStudent} className="flex gap-2">
              <input
                type="text"
                value={singleNumber}
                onChange={(e) => setSingleNumber(e.target.value)}
                placeholder="座號(選填)"
                className="w-24 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <input
                type="text"
                value={singleName}
                onChange={(e) => setSingleName(e.target.value)}
                placeholder="學生姓名 (必填)"
                className="flex-1 text-sm px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition"
              >
                新增
              </button>
            </form>
          </div>
        </div>

        {/* Current Roster List Column */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col h-[520px]">
            {/* Header with count & search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">目前學生名冊</h3>
                  <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {students.length} 人
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">點擊右側垃圾桶可單獨移除</p>
              </div>

              <div className="flex items-center gap-2">
                {students.length > 0 && (
                  <>
                    <button
                      onClick={handleExportCSV}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                      title="匯出為 CSV 備份"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition"
                      title="清空全班名冊"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search Filter */}
            {students.length > 5 && (
              <div className="relative mt-3 mb-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜尋姓名或座號..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            )}

            {/* Student list content */}
            <div className="flex-1 overflow-y-auto mt-2 pr-1 space-y-1.5">
              {students.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">目前尚無學生資料</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    請從左側上傳 CSV 檔案、貼上名單，或點擊「載入示範名單」快速測試。
                  </p>
                  <button
                    onClick={handleLoadSample}
                    className="mt-4 px-3.5 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold rounded-lg transition"
                  >
                    立即載入 30 人示範名單
                  </button>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400">找不到符合搜尋條件的學生</div>
              ) : (
                filteredStudents.map((stu, index) => (
                  <div
                    key={stu.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 text-center text-xs font-mono font-medium text-slate-400">
                        {stu.studentNumber ? `#${stu.studentNumber}` : `${index + 1}.`}
                      </span>
                      <span className="text-sm font-bold text-slate-800">{stu.name}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveStudent(stu.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-md transition"
                      title="移除此學生"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Bottom stats & action footer */}
            {students.length > 0 && (
              <div className="pt-3 mt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>
                  共 {students.length} 位學生
                  {searchTerm && ` (篩選出 ${filteredStudents.length} 位)`}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={onGoToPicker}
                    className="text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    抽籤 →
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={onGoToGrouping}
                    className="text-emerald-600 hover:text-emerald-800 font-semibold"
                  >
                    分組 →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
