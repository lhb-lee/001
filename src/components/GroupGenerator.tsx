import React, { useState, useEffect, useId } from 'react';
import {
  Users,
  Shuffle,
  Copy,
  CheckCircle2,
  Download,
  Printer,
  Edit2,
  Crown,
  Search,
  ArrowRightLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { Student, Group, GroupSettings, GroupingMode, RemainderStrategy } from '../types';
import { generateGroups, formatGroupsAsText } from '../utils/grouping';
import { playShuffleSound } from '../utils/audio';

interface GroupGeneratorProps {
  students: Student[];
  onOpenRoster: () => void;
}

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({ students, onOpenRoster }) => {
  const groupSizeInputId = useId();
  const groupCountInputId = useId();
  const [settings, setSettings] = useState<GroupSettings>({
    mode: 'bySize',
    groupSize: 4,
    groupCount: 4,
    remainderStrategy: 'distribute',
    prefix: '第 {n} 組',
  });

  const [groups, setGroups] = useState<Group[]>([]);
  const [copied, setCopied] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [leaderMap, setLeaderMap] = useState<Record<string, string>>({}); // groupId -> studentId
  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  // Moving student modal/state
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(
    null
  );

  // Auto-generate on first render or when students list becomes non-empty
  useEffect(() => {
    if (students.length > 0 && groups.length === 0) {
      const initial = generateGroups(students, settings);
      setGroups(initial);
    }
  }, [students]);

  const handleShuffle = () => {
    if (students.length === 0) return;
    playShuffleSound();
    const newGroups = generateGroups(students, settings);
    setGroups(newGroups);
    setLeaderMap({});
    setMovingStudent(null);
  };

  const handleCopy = () => {
    if (groups.length === 0) return;
    const text = formatGroupsAsText(groups);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (groups.length === 0) return;
    const text = formatGroupsAsText(groups);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `課堂分組表_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const startEditGroupName = (group: Group) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  const saveGroupName = (groupId: string) => {
    if (editingGroupName.trim()) {
      setGroups((prev) =>
        prev.map((g) => (g.id === groupId ? { ...g, name: editingGroupName.trim() } : g))
      );
    }
    setEditingGroupId(null);
  };

  const toggleLeader = (groupId: string, studentId: string) => {
    setLeaderMap((prev) => {
      if (prev[groupId] === studentId) {
        const next = { ...prev };
        delete next[groupId];
        return next;
      }
      return { ...prev, [groupId]: studentId };
    });
  };

  const handleMoveToGroup = (targetGroupId: string) => {
    if (!movingStudent || movingStudent.fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id === movingStudent.fromGroupId) {
          return {
            ...g,
            members: g.members.filter((m) => m.id !== movingStudent.student.id),
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, movingStudent.student],
          };
        }
        return g;
      })
    );

    setMovingStudent(null);
  };

  // Calculate preview stats
  const total = students.length;
  let estimatedGroups = 0;
  if (total > 0) {
    if (settings.mode === 'bySize') {
      const size = Math.max(1, settings.groupSize);
      estimatedGroups =
        settings.remainderStrategy === 'distribute'
          ? Math.max(1, Math.floor(total / size))
          : Math.ceil(total / size);
    } else {
      estimatedGroups = Math.min(total, Math.max(1, settings.groupCount));
    }
  }

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">名單尚未建立</h3>
        <p className="text-slate-500 text-sm mb-6">
          分組需要學生名單來源，請先上傳 CSV 檔案或直接貼上學生名冊。
        </p>
        <button
          onClick={onOpenRoster}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-indigo-200 transition"
        >
          前往匯入學生名單
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls & Configuration Panel */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-5 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>自動分組設定</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              全班共 <strong className="text-indigo-600 font-bold">{total}</strong> 位學生，
              預計分成 <strong className="text-emerald-700 font-bold">{estimatedGroups}</strong> 組
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleShuffle}
              id="generate-groups-btn"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-sm hover:shadow-md transition active:scale-95"
            >
              <Shuffle className="w-4 h-4" />
              <span>隨機自動分組</span>
            </button>

            {groups.length > 0 && (
              <>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition"
                  title="複製分組結果至剪貼簿"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600">已複製</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>複製結果</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownload}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                  title="下載分組文字檔"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={handlePrint}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
                  title="列印分組表"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Setting Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode switch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">分組方式：</label>
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mode: 'bySize' }))}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition ${
                  settings.mode === 'bySize'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依每組人數
              </button>
              <button
                type="button"
                onClick={() => setSettings((s) => ({ ...s, mode: 'byCount' }))}
                className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition ${
                  settings.mode === 'byCount'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                依指定組數
              </button>
            </div>
          </div>

          {/* Group Size / Group Count Input */}
          {settings.mode === 'bySize' ? (
            <div>
              <label htmlFor={groupSizeInputId} className="block text-xs font-bold text-slate-700 mb-1.5">
                每組人數 (人)：
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, groupSize: Math.max(2, s.groupSize - 1) }))
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200"
                >
                  -
                </button>
                <input
                  id={groupSizeInputId}
                  type="number"
                  min={2}
                  max={total || 30}
                  value={settings.groupSize}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      groupSize: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-20 text-center py-1.5 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, groupSize: Math.min(total, s.groupSize + 1) }))
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">人 / 組</span>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor={groupCountInputId} className="block text-xs font-bold text-slate-700 mb-1.5">
                總共分成幾組：
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, groupCount: Math.max(2, s.groupCount - 1) }))
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200"
                >
                  -
                </button>
                <input
                  id={groupCountInputId}
                  type="number"
                  min={2}
                  max={total || 20}
                  value={settings.groupCount}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      groupCount: Math.max(1, parseInt(e.target.value) || 1),
                    }))
                  }
                  className="w-20 text-center py-1.5 text-sm font-bold border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({ ...s, groupCount: Math.min(total, s.groupCount + 1) }))
                  }
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center border border-slate-200"
                >
                  +
                </button>
                <span className="text-xs text-slate-500">組</span>
              </div>
            </div>
          )}

          {/* Remainder strategy for bySize */}
          {settings.mode === 'bySize' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                餘數人數處理：
              </label>
              <select
                value={settings.remainderStrategy}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    remainderStrategy: e.target.value as RemainderStrategy,
                  }))
                }
                className="w-full text-xs font-medium py-2 px-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-hidden"
              >
                <option value="distribute">平均分配至各組（組人數接近）</option>
                <option value="separateGroup">剩餘學生單獨成組</option>
              </select>
            </div>
          )}

          {/* Search student within groups */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              搜尋學生所在組別：
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchMemberQuery}
                onChange={(e) => setSearchMemberQuery(e.target.value)}
                placeholder="輸入姓名快速高亮定位..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Moving Student prompt banner */}
        {movingStudent && (
          <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                正在微調移動學生：<strong>{movingStudent.student.name}</strong>
                ，請點選目標組別卡片上的<strong>「移至此組」</strong>按鈕完成調動。
              </span>
            </div>
            <button
              onClick={() => setMovingStudent(null)}
              className="text-slate-500 hover:text-slate-800 font-semibold px-2 py-1 bg-white rounded-md border border-indigo-200"
            >
              取消調動
            </button>
          </div>
        )}
      </div>

      {/* Visualized Groups Display Grid */}
      {groups.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 text-slate-400">
          <p className="text-sm font-medium">尚未產生成果，請點擊上方「隨機自動分組」按鈕。</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>
                分組成果視覺化呈現 · 點擊組名可自訂修改 · 點擊星號可指派小組長 · 點擊姓名旁的箭頭可換組微調
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {groups.map((group, groupIdx) => {
              const isTargetMoveGroup = movingStudent && movingStudent.fromGroupId !== group.id;

              return (
                <div
                  key={group.id}
                  className={`rounded-2xl border transition-all duration-200 flex flex-col ${
                    group.color.bg
                  } ${group.color.border} ${
                    isTargetMoveGroup
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-[1.02] shadow-md'
                      : 'hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-200/60 flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-2xl select-none" role="img" aria-label="team icon">
                        {group.icon}
                      </span>
                      {editingGroupId === group.id ? (
                        <input
                          type="text"
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          onBlur={() => saveGroupName(group.id)}
                          onKeyDown={(e) => e.key === 'Enter' && saveGroupName(group.id)}
                          autoFocus
                          className="text-sm font-bold px-1.5 py-0.5 border border-indigo-400 rounded bg-white outline-hidden w-36"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 truncate">
                          <h4 className={`text-sm font-black truncate ${group.color.text}`}>
                            {group.name}
                          </h4>
                          <button
                            onClick={() => startEditGroupName(group)}
                            className="text-slate-400 hover:text-slate-700 opacity-60 hover:opacity-100 transition print:hidden"
                            title="修改組名"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${group.color.badge}`}
                    >
                      {group.members.length} 人
                    </span>
                  </div>

                  {/* Target move action button if in moving mode */}
                  {isTargetMoveGroup && (
                    <button
                      onClick={() => handleMoveToGroup(group.id)}
                      className="mx-3 mt-3 py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 animate-pulse"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>移入此組</span>
                    </button>
                  )}

                  {/* Member List */}
                  <div className="p-4 flex-1 space-y-2">
                    {group.members.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">目前暫無成員</div>
                    ) : (
                      group.members.map((member, memberIdx) => {
                        const isLeader = leaderMap[group.id] === member.id;
                        const isHighlighted =
                          searchMemberQuery.trim().length > 0 &&
                          (member.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) ||
                            (member.studentNumber &&
                              member.studentNumber.includes(searchMemberQuery)));

                        return (
                          <div
                            key={member.id}
                            className={`flex items-center justify-between p-2 rounded-xl transition-all ${
                              isHighlighted
                                ? 'bg-amber-100 ring-2 ring-amber-400 font-bold'
                                : isLeader
                                ? 'bg-white shadow-xs border border-amber-300'
                                : 'bg-white/80 hover:bg-white border border-slate-200/60 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 text-center text-xs font-mono font-medium text-slate-400">
                                {member.studentNumber ? `#${member.studentNumber}` : `${memberIdx + 1}`}
                              </span>
                              <span className="text-sm font-bold text-slate-800 truncate">
                                {member.name}
                              </span>

                              {isLeader && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md">
                                  <Crown className="w-3 h-3 text-amber-600" />
                                  <span>組長</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 print:hidden">
                              {/* Toggle Leader button */}
                              <button
                                onClick={() => toggleLeader(group.id, member.id)}
                                className={`p-1 rounded-md transition ${
                                  isLeader
                                    ? 'text-amber-500 hover:text-amber-600'
                                    : 'text-slate-300 hover:text-amber-500'
                                }`}
                                title={isLeader ? '取消組長' : '設為組長'}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              {/* Move to another group button */}
                              <button
                                onClick={() =>
                                  setMovingStudent({
                                    student: member,
                                    fromGroupId: group.id,
                                  })
                                }
                                className="p-1 text-slate-300 hover:text-indigo-600 rounded-md transition"
                                title="移至其他組"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Card footer summary */}
                  <div className="px-4 py-2 bg-black/5 rounded-b-2xl text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-200/40">
                    <span>第 {groupIdx + 1} 小隊</span>
                    <span>佔全班 {Math.round((group.members.length / total) * 100)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
