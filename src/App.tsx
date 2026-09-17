/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RosterManager } from './components/RosterManager';
import { RandomPicker } from './components/RandomPicker';
import { GroupGenerator } from './components/GroupGenerator';
import { Student } from './types';
import { SAMPLE_STUDENTS } from './utils/csvParser';
import { setSoundMuted as setAudioMuted } from './utils/audio';

const STORAGE_KEY_STUDENTS = 'classroom_picker_students_v1';
const STORAGE_KEY_MUTED = 'classroom_picker_muted_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'roster' | 'picker' | 'groups'>('picker');

  // Load students from localStorage or fallback to sample students
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        } catch {
          // ignore corrupted data
        }
      }
    }
    return SAMPLE_STUDENTS;
  });

  // Sound muted state
  const [soundMuted, setSoundMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY_MUTED) === 'true';
    }
    return false;
  });

  // Keep Web Audio helper in sync
  useEffect(() => {
    setAudioMuted(soundMuted);
    localStorage.setItem(STORAGE_KEY_MUTED, String(soundMuted));
  }, [soundMuted]);

  // Persist students
  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
    localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(newStudents));
  };

  const handleToggleSound = () => {
    setSoundMuted((prev) => !prev);
  };

  const handleLoadSample = () => {
    handleUpdateStudents(SAMPLE_STUDENTS);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar with Tab switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentCount={students.length}
        soundMuted={soundMuted}
        onToggleSound={handleToggleSound}
        onLoadSample={handleLoadSample}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'roster' && (
          <RosterManager
            students={students}
            onUpdateStudents={handleUpdateStudents}
            onGoToPicker={() => setActiveTab('picker')}
            onGoToGrouping={() => setActiveTab('groups')}
          />
        )}

        {activeTab === 'picker' && (
          <RandomPicker
            allStudents={students}
            onOpenRoster={() => setActiveTab('roster')}
            soundMuted={soundMuted}
            onToggleSound={handleToggleSound}
          />
        )}

        {activeTab === 'groups' && (
          <GroupGenerator
            students={students}
            onOpenRoster={() => setActiveTab('roster')}
          />
        )}
      </main>

      {/* Teacher Tool Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 font-medium">
            <span>課堂抽籤與自動分組小幫手 · 專為學校老師與教育工作者設計</span>
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>支援 CSV / TXT / 貼上名冊</span>
            <span>·</span>
            <span>內建 Web Audio 音效與動畫</span>
            <span>·</span>
            <span>支援課堂大螢幕投影</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
