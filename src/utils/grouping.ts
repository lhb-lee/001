import { Group, GroupSettings, Student } from '../types';

export const TEAM_THEMES = [
  {
    name: '雄獅組',
    icon: '🦁',
    color: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      text: 'text-amber-900',
      lightBg: 'bg-amber-500/10',
    },
  },
  {
    name: '海豚組',
    icon: '🐬',
    color: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      text: 'text-sky-900',
      lightBg: 'bg-sky-500/10',
    },
  },
  {
    name: '翠竹組',
    icon: '🎋',
    color: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      text: 'text-emerald-900',
      lightBg: 'bg-emerald-500/10',
    },
  },
  {
    name: '紫晶組',
    icon: '🔮',
    color: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      badge: 'bg-purple-100 text-purple-800 border-purple-300',
      text: 'text-purple-900',
      lightBg: 'bg-purple-500/10',
    },
  },
  {
    name: '烈焰組',
    icon: '🔥',
    color: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      text: 'text-rose-900',
      lightBg: 'bg-rose-500/10',
    },
  },
  {
    name: '火箭組',
    icon: '🚀',
    color: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      text: 'text-indigo-900',
      lightBg: 'bg-indigo-500/10',
    },
  },
  {
    name: '青鳥組',
    icon: '🦜',
    color: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      text: 'text-teal-900',
      lightBg: 'bg-teal-500/10',
    },
  },
  {
    name: '閃電組',
    icon: '⚡',
    color: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      text: 'text-yellow-900',
      lightBg: 'bg-yellow-500/10',
    },
  },
  {
    name: '幸運草組',
    icon: '🍀',
    color: {
      bg: 'bg-lime-50',
      border: 'border-lime-200',
      badge: 'bg-lime-100 text-lime-800 border-lime-300',
      text: 'text-lime-900',
      lightBg: 'bg-lime-500/10',
    },
  },
  {
    name: '智鴞組',
    icon: '🦉',
    color: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      text: 'text-cyan-900',
      lightBg: 'bg-cyan-500/10',
    },
  },
  {
    name: '晨星組',
    icon: '⭐',
    color: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      badge: 'bg-orange-100 text-orange-800 border-orange-300',
      text: 'text-orange-900',
      lightBg: 'bg-orange-500/10',
    },
  },
  {
    name: '飛龍組',
    icon: '🐲',
    color: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      badge: 'bg-red-100 text-red-800 border-red-300',
      text: 'text-red-900',
      lightBg: 'bg-red-500/10',
    },
  },
];

/**
 * Shuffle an array randomly using Fisher-Yates
 */
export function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate groups based on settings
 */
export function generateGroups(students: Student[], settings: GroupSettings): Group[] {
  if (students.length === 0) return [];

  const shuffled = shuffleArray(students);
  const totalStudents = shuffled.length;
  let targetNumGroups = 1;

  if (settings.mode === 'bySize') {
    const size = Math.max(1, settings.groupSize);
    if (settings.remainderStrategy === 'distribute') {
      targetNumGroups = Math.max(1, Math.floor(totalStudents / size));
    } else {
      // separate group for remainder
      targetNumGroups = Math.ceil(totalStudents / size);
    }
  } else {
    // byCount
    targetNumGroups = Math.min(totalStudents, Math.max(1, settings.groupCount));
  }

  // Initialize empty groups
  const groups: Group[] = [];
  for (let i = 0; i < targetNumGroups; i++) {
    const theme = TEAM_THEMES[i % TEAM_THEMES.length];
    const groupNum = i + 1;
    groups.push({
      id: `group-${Date.now()}-${i}`,
      name: `第 ${groupNum} 組 · ${theme.name}`,
      icon: theme.icon,
      color: theme.color,
      members: [],
    });
  }

  if (settings.mode === 'bySize' && settings.remainderStrategy === 'separateGroup') {
    // Chunk sequentially into size
    let currGroupIdx = 0;
    shuffled.forEach((student, index) => {
      currGroupIdx = Math.floor(index / settings.groupSize);
      if (groups[currGroupIdx]) {
        groups[currGroupIdx].members.push(student);
      }
    });
  } else {
    // Round-robin distribution for balanced group sizes
    shuffled.forEach((student, index) => {
      const groupIdx = index % targetNumGroups;
      groups[groupIdx].members.push(student);
    });
  }

  return groups.filter((g) => g.members.length > 0);
}

/**
 * Format groups as readable text for copying
 */
export function formatGroupsAsText(groups: Group[]): string {
  let result = `【課堂分組名單】共 ${groups.length} 組\n`;
  result += `產生日時：${new Date().toLocaleString('zh-TW')}\n\n`;

  groups.forEach((g) => {
    const memberNames = g.members
      .map((m) => (m.studentNumber ? `${m.name}(${m.studentNumber})` : m.name))
      .join('、');
    result += `▶ ${g.icon} ${g.name}（${g.members.length}人）：\n   ${memberNames}\n\n`;
  });

  return result;
}
