import React from 'react';
import { Users, Dices, UserCheck, Volume2, VolumeX, Sparkles, FileSpreadsheet } from 'lucide-react';

interface NavbarProps {
  activeTab: 'roster' | 'picker' | 'groups';
  setActiveTab: (tab: 'roster' | 'picker' | 'groups') => void;
  studentCount: number;
  soundMuted: boolean;
  onToggleSound: () => void;
  onLoadSample: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  studentCount,
  soundMuted,
  onToggleSound,
  onLoadSample,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                課堂抽籤與自動分組小幫手
              </h1>
              <p className="text-xs text-slate-500 mt-1 hidden sm:block">
                教師專用 · 隨機點名與視覺化自動分組工具
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200/80">
            <button
              id="tab-roster-btn"
              onClick={() => setActiveTab('roster')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'roster'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>名單管理</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full font-mono font-semibold ${
                  activeTab === 'roster'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {studentCount}
              </span>
            </button>

            <button
              id="tab-picker-btn"
              onClick={() => setActiveTab('picker')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'picker'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Dices className="w-4 h-4 text-indigo-600" />
              <span>隨機抽籤</span>
            </button>

            <button
              id="tab-groups-btn"
              onClick={() => setActiveTab('groups')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'groups'
                  ? 'bg-white text-indigo-600 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Users className="w-4 h-4 text-emerald-600" />
              <span>自動分組</span>
            </button>
          </nav>

          {/* Sound toggle and quick sample */}
          <div className="flex items-center gap-2">
            {studentCount === 0 && (
              <button
                onClick={onLoadSample}
                className="hidden md:flex items-center gap-1.5 text-xs bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg font-medium transition-colors"
                title="載入 30 人範例名單供立即試用"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>載入示範名單</span>
              </button>
            )}

            <button
              id="toggle-sound-btn"
              onClick={onToggleSound}
              className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-medium ${
                soundMuted
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
              title={soundMuted ? '音效已靜音（點擊開啟）' : '音效已開啟（點擊靜音）'}
              aria-label="音效開關"
            >
              {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden lg:inline">{soundMuted ? '靜音' : '音效開啟'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
