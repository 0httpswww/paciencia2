export const LEVELS = [
  { xp: 0, title: "Novato" },
  { xp: 100, title: "Aprendiz" },
  { xp: 300, title: "Amador" },
  { xp: 600, title: "Entusiasta" },
  { xp: 1000, title: "Profissional" },
  { xp: 1500, title: "Mestre" },
  { xp: 2200, title: "Grão-Mestre" },
  { xp: 3000, title: "Lenda do Paciência" },
];

const XP_KEY = 'solitaire_pro_xp';

export const getStoredXP = (): number => {
  try {
    const stored = localStorage.getItem(XP_KEY);
    return stored ? parseInt(stored, 10) : 0;
  } catch (e) {
    return 0;
  }
};

export const addXP = (amount: number): number => {
  try {
    const current = getStoredXP();
    const newXP = current + amount;
    localStorage.setItem(XP_KEY, newXP.toString());
    return newXP;
  } catch (e) {
    return 0;
  }
};

export const getLevelInfo = (xp: number) => {
  let currentLevel = 1;
  let currentTitle = LEVELS[0].title;
  let nextLevelXP = LEVELS[1].xp;
  let prevLevelXP = LEVELS[0].xp;

  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) {
      currentLevel = i + 1;
      currentTitle = LEVELS[i].title;
      prevLevelXP = LEVELS[i].xp;
      nextLevelXP = LEVELS[i + 1]?.xp || xp * 2; // Fallback for max level
    } else {
      break;
    }
  }

  const progress = Math.min(100, Math.max(0, ((xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

  return {
    level: currentLevel,
    title: currentTitle,
    nextLevelXP,
    progress,
    currentXP: xp
  };
};
