import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Dices,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  History,
  CheckCircle2,
  Users,
  Copy,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { Student, DrawHistoryItem } from '../types';
import { playTickSound, playWinFanfare } from '../utils/audio';

interface RandomPickerProps {
  allStudents: Student[];
  onOpenRoster: () => void;
  soundMuted: boolean;
  onToggleSound: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  allStudents,
  onOpenRoster,
  soundMuted,
  onToggleSound,
}) => {
  // Settings
  const [allowRepeat, setAllowRepeat] = useState<boolean>(false);
  const [spinSpeed, setSpinSpeed] = useState<'fast' | 'normal' | 'dramatic'>('normal');

  // Pool & State
  const [remainingStudents, setRemainingStudents] = useState<Student[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState<string>('？');
  const [currentDisplayNumber, setCurrentDisplayNumber] = useState<string | undefined>(undefined);
  const [winner, setWinner] = useState<Student | null>(null);
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedHistory, setCopiedHistory] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const spinTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync remaining pool when allStudents changes or allowRepeat toggles
  useEffect(() => {
    setRemainingStudents(allStudents);
  }, [allStudents]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    };
  }, []);

  // Determine active candidates pool
  const activePool = allowRepeat ? allStudents : remainingStudents;

  const triggerConfetti = () => {
    try {
      // Fire multi-stage celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#a855f7', '#fbbf24'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#10b981', '#3b82f6', '#f43f5e'],
        });
      }, 200);
    } catch {
      // Ignore if canvas-confetti fails
    }
  };

  const handleStartDraw = () => {
    if (isSpinning) return;

    if (activePool.length === 0) {
      if (!allowRepeat && allStudents.length > 0) {
        alert('名單內所有學生均已抽出！請點擊「重置抽籤池」重新開始。');
      } else {
        alert('目前名單為空，請先加入學生！');
      }
      return;
    }

    setIsSpinning(true);
    setWinner(null);

    // Pick the true winner ahead of time from candidate pool
    const winnerIndex = Math.floor(Math.random() * activePool.length);
    const chosenWinner = activePool[winnerIndex];

    // Determine spin timings based on speed setting
    const totalDuration = spinSpeed === 'fast' ? 1800 : spinSpeed === 'dramatic' ? 4200 : 2800;
    const startTime = Date.now();

    let stepDelay = 40; // Starts fast (40ms per name)

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / totalDuration;

      if (progress < 1) {
        // Pick a random student for visual effect
        const randomCand = allStudents[Math.floor(Math.random() * allStudents.length)];
        setCurrentDisplayName(randomCand.name);
        setCurrentDisplayNumber(randomCand.studentNumber);

        // Dynamic pitch and sound
        const pitchFactor = 0.8 + progress * 0.6;
        playTickSound(pitchFactor);

        // Exponential slowdown as progress nears 1
        if (progress > 0.6) {
          stepDelay = 60 + Math.pow(progress, 3) * 350;
        } else if (progress > 0.4) {
          stepDelay = 55;
        } else {
          stepDelay = 45;
        }

        spinTimerRef.current = setTimeout(step, stepDelay);
      } else {
        // Animation finished, land on chosen winner!
        setCurrentDisplayName(chosenWinner.name);
        setCurrentDisplayNumber(chosenWinner.studentNumber);
        setWinner(chosenWinner);
        setIsSpinning(false);

        // Play victory sounds and confetti
        playWinFanfare();
        triggerConfetti();

        // Update history
        const newHistoryItem: DrawHistoryItem = {
          id: `hist-${Date.now()}`,
          student: chosenWinner,
          timestamp: Date.now(),
          order: history.length + 1,
        };
        setHistory((prev) => [newHistoryItem, ...prev]);

        // If not allowing repeat, remove winner from pool
        if (!allowRepeat) {
          setRemainingStudents((prev) => prev.filter((s) => s.id !== chosenWinner.id));
        }
      }
    };

    step();
  };

  const handleResetPool = () => {
    setRemainingStudents(allStudents);
    setWinner(null);
    setCurrentDisplayName('？');
    setCurrentDisplayNumber(undefined);
  };

  const handleClearHistory = () => {
    if (history.length === 0) return;
    if (window.confirm('確定要清空本次抽籤歷史紀錄嗎？')) {
      setHistory([]);
    }
  };

  const handleCopyHistory = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (h) =>
          `第 ${h.order} 號：${h.student.name}${h.student.studentNumber ? ` (${h.student.studentNumber})` : ''} - ${new Date(h.timestamp).toLocaleTimeString()}`
      )
      .join('\n');
    navigator.clipboard.writeText(`【課堂隨機抽籤結果】\n` + text);
    setCopiedHistory(true);
    setTimeout(() => setCopiedHistory(false), 2000);
  };

  const toggleFullscreenMode = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (allStudents.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Dices className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">名單尚未建立</h3>
        <p className="text-slate-500 text-sm mb-6">
          抽籤需要學生名單來源，請先上傳 CSV 檔案或直接貼上學生名冊。
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
    <div
      ref={containerRef}
      className={`space-y-6 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-slate-950 p-6 md:p-12 overflow-y-auto flex flex-col justify-between text-white'
          : ''
      }`}
    >
      {/* Controls / Options bar */}
      <div
        className={`flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
          isFullscreen
            ? 'bg-slate-900/80 border-slate-800'
            : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center gap-4">
          {/* Toggle: Allow Repeat (允許重複 / 不重複) */}
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold ${
                isFullscreen ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              抽籤模式：
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                id="mode-no-repeat-btn"
                disabled={isSpinning}
                onClick={() => setAllowRepeat(false)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  !allowRepeat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                不重複抽取
              </button>
              <button
                type="button"
                id="mode-allow-repeat-btn"
                disabled={isSpinning}
                onClick={() => setAllowRepeat(true)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  allowRepeat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                允許重複抽取
              </button>
            </div>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold ${
                isFullscreen ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              節奏：
            </span>
            <select
              value={spinSpeed}
              disabled={isSpinning}
              onChange={(e) => setSpinSpeed(e.target.value as 'fast' | 'normal' | 'dramatic')}
              className={`text-xs font-medium py-1 px-2 rounded-lg border outline-hidden transition ${
                isFullscreen
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="fast">快速 (1.8秒)</option>
              <option value="normal">標準 (2.8秒)</option>
              <option value="dramatic">刺激懸疑 (4.2秒)</option>
            </select>
          </div>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-lg border transition ${
              soundMuted
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : isFullscreen
                ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="音效開關"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{soundMuted ? '音效已靜音' : '音效已開啟'}</span>
          </button>
        </div>

        {/* Right side stats & presentation toggle */}
        <div className="flex items-center gap-3">
          {!allowRepeat && (
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  isFullscreen
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}
              >
                待抽池：<strong>{remainingStudents.length}</strong> / {allStudents.length} 人
              </span>
              <button
                disabled={isSpinning || remainingStudents.length === allStudents.length}
                onClick={handleResetPool}
                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition disabled:opacity-30"
                title="重置待抽池（將所有人放回）"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={toggleFullscreenMode}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg border transition ${
              isFullscreen
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="課堂投影全螢幕模式"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>結束全螢幕</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>課堂投影模式</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Big Stage Card */}
      <div
        className={`relative overflow-hidden rounded-3xl border transition-all flex flex-col items-center justify-center ${
          isFullscreen
            ? 'flex-1 my-4 bg-gradient-to-b from-slate-900 to-slate-950 border-indigo-500/40 p-8 min-h-[480px]'
            : 'bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-indigo-900/60 p-8 md:p-14 text-white shadow-xl min-h-[420px]'
        }`}
      >
        {/* Background glow effects */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Status tag */}
        <div className="relative z-10 mb-6 flex items-center gap-2">
          {isSpinning ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-300 text-sm font-semibold animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
              <span>正在隨機抽取中... 伴隨緊張音效與動畫</span>
            </span>
          ) : winner ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-sm font-bold animate-bounce">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span>幸運中選！</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-sm font-medium">
              <Dices className="w-4 h-4 text-indigo-400" />
              <span>點擊下方按鈕開始隨機抽籤</span>
            </span>
          )}
        </div>

        {/* Huge Name Display Box with animated Slot/Card styling */}
        <div className="relative z-10 w-full max-w-xl mx-auto mb-8">
          <div
            className={`relative rounded-3xl p-8 md:p-12 text-center transition-all border shadow-2xl ${
              winner && !isSpinning
                ? 'bg-gradient-to-b from-indigo-900/80 to-slate-900/90 border-amber-400/60 shadow-amber-500/20 scale-105'
                : isSpinning
                ? 'bg-slate-900/90 border-indigo-500/60 shadow-indigo-500/30'
                : 'bg-slate-900/70 border-slate-800 shadow-slate-950/40'
            }`}
          >
            {/* Student Number pill */}
            {currentDisplayNumber && (
              <div className="inline-block mb-3">
                <span className="text-xs sm:text-sm font-mono font-bold px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
                  座號 #{currentDisplayNumber}
                </span>
              </div>
            )}

            {/* Giant Student Name */}
            <div
              className={`font-black tracking-wider transition-all select-none ${
                isFullscreen ? 'text-6xl sm:text-8xl md:text-9xl' : 'text-5xl sm:text-7xl md:text-8xl'
              } ${
                winner && !isSpinning
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-300 drop-shadow-md'
                  : isSpinning
                  ? 'text-indigo-200 scale-95 blur-[0.3px]'
                  : 'text-slate-400'
              }`}
            >
              {currentDisplayName}
            </div>

            {/* Winner Badge footer */}
            {winner && !isSpinning && (
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium mt-4 tracking-wide">
                🎉 請 {winner.name} 同學回答或發言！
              </p>
            )}
          </div>
        </div>

        {/* Big Action Buttons */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-4">
          <button
            id="start-draw-button"
            disabled={isSpinning || (!allowRepeat && remainingStudents.length === 0)}
            onClick={handleStartDraw}
            className={`group relative px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-base sm:text-lg font-bold transition-all shadow-xl flex items-center gap-3 active:scale-95 ${
              isSpinning
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-80'
                : !allowRepeat && remainingStudents.length === 0
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105'
            }`}
          >
            <Dices
              className={`w-6 h-6 transition-transform ${
                isSpinning ? 'animate-spin' : 'group-hover:rotate-45'
              }`}
            />
            <span>{isSpinning ? '抽取中...' : '開始隨機抽籤'}</span>
          </button>

          {!allowRepeat && remainingStudents.length === 0 && (
            <button
              onClick={handleResetPool}
              className="px-6 py-3.5 rounded-2xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition flex items-center gap-2 shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>全班已抽完，點擊重置名單</span>
            </button>
          )}
        </div>
      </div>

      {/* History & Remaining Pool Area (Normal view) */}
      {!isFullscreen && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* History Drawer (Col 7) */}
          <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">本次抽籤紀錄</h4>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  已抽 {history.length} 次
                </span>
              </div>

              {history.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyHistory}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                    title="複製抽籤紀錄"
                  >
                    {copiedHistory ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">已複製</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>複製名單</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleClearHistory}
                    className="text-xs text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    清空紀錄
                  </button>
                </div>
              )}
            </div>

            <div className="mt-3 overflow-y-auto max-h-56 pr-1 space-y-2">
              {history.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  尚無抽籤紀錄，點擊「開始隨機抽籤」產生命單。
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition ${
                      idx === 0
                        ? 'bg-amber-50/70 border-amber-200 font-medium text-amber-950'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono font-bold text-xs ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950 shadow-xs'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {item.order}
                      </span>
                      <span className="text-sm font-bold">{item.student.name}</span>
                      {item.student.studentNumber && (
                        <span className="text-slate-400 font-mono">#{item.student.studentNumber}</span>
                      )}
                    </div>
                    <span className="text-slate-400">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Remaining Pool / Candidate Roster (Col 5) */}
          <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {allowRepeat ? '候選學生名冊' : '未抽出學生 (待抽池)'}
                </h4>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold px-2 py-0.5 rounded-full">
                {activePool.length} 人
              </span>
            </div>

            <div className="mt-3 overflow-y-auto max-h-56 pr-1 flex flex-wrap gap-1.5">
              {activePool.length === 0 ? (
                <div className="w-full py-8 text-center text-xs text-slate-400">
                  全數同學皆已抽出！可點擊重置按鈕重新開始。
                </div>
              ) : (
                activePool.map((stu) => (
                  <span
                    key={stu.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200/80 transition"
                  >
                    {stu.studentNumber && (
                      <span className="text-slate-400 font-mono text-[11px]">
                        #{stu.studentNumber}
                      </span>
                    )}
                    <span>{stu.name}</span>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
