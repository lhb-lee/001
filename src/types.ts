export interface Student {
  id: string;
  name: string;
  studentNumber?: string;
}

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
  order: number;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  color: {
    bg: string;
    border: string;
    badge: string;
    text: string;
    lightBg: string;
  };
  members: Student[];
}

export type GroupingMode = 'bySize' | 'byCount';
export type RemainderStrategy = 'distribute' | 'separateGroup';

export interface GroupSettings {
  mode: GroupingMode;
  groupSize: number; // For bySize (e.g. 4 people per group)
  groupCount: number; // For byCount (e.g. 6 groups)
  remainderStrategy: RemainderStrategy; // When total % groupSize != 0
  prefix: string; // "第 {n} 組" or "Team {n}"
}

export interface DrawSettings {
  allowRepeat: boolean;
  soundEnabled: boolean;
  durationSeconds: number; // Duration of spin (e.g., 2.5s)
}
