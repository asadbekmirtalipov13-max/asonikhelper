import { ChorePreset } from "./types";

export const DEFAULT_CHORE_PRESETS: ChorePreset[] = [
  {
    id: "preset-vacuum",
    title: "Пропылесосить в комнате",
    description: "Тщательно пропылесосить пол в комнате, убрать игрушки и протереть пыль на столе.",
    points: 10
  },
  {
    id: "preset-trash",
    title: "Выбросить мусор",
    description: "Собрать мусор из всех корзин в доме, заменить пакеты и вынести в мусорный бак на улице.",
    points: 5
  },
  {
    id: "preset-dishes",
    title: "Помыть посуду",
    description: "Вымыть всю посуду в раковине после еды, протереть стол и сложить посуду на сушилку.",
    points: 8
  },
  {
    id: "preset-shop",
    title: "Сходить в магазин",
    description: "Сходить в ближайший продуктовый магазин по списку мамы и принести сдачу.",
    points: 12
  },
  {
    id: "preset-study",
    title: "Сделать уроки",
    description: "Качественно выполнить все домашние задания на завтра без напоминаний.",
    points: 15
  },
  {
    id: "preset-bed",
    title: "Заправить кровать",
    description: "Аккуратно сложить одеяло, застелить покрывало и красиво расставить подушки.",
    points: 4
  }
];

export const PRESET_AVATARS = [
  { emoji: "🦊", name: "Лисенок" },
  { emoji: "🐼", name: "Панда" },
  { emoji: "🦁", name: "Львенок" },
  { emoji: "🦖", name: "Дино" },
  { emoji: "🦄", name: "Единорог" },
  { emoji: "🐨", name: "Коала" },
  { emoji: "🐯", name: "Тигренок" },
  { emoji: "🦉", name: "Сова" },
  { emoji: "🐸", name: "Лягушонок" },
  { emoji: "🐝", name: "Пчелка" },
  { emoji: "🎮", name: "Геймер" },
  { emoji: "⚽", name: "Чемпион" },
  { emoji: "🎨", name: "Творец" },
  { emoji: "🚀", name: "Космонавт" }
];

export const RANDOM_ADJECTIVES = [
  "Веселый", "Шустрый", "Умный", "Смелый", "Добрый", "Ловкий", "Мудрый", "Крутой", "Честный", "Быстрый"
];

export const RANDOM_NOUNS = [
  "Тигр", "Сокол", "Барс", "Волк", "Орел", "Гепард", "Ниндзя", "Рыцарь", "Мастер", "Дракон"
];

export function generateRandomNickname(): string {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)];
  const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj}${noun}${num}`;
}

export function getRandomAvatar(): string {
  const av = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
  return av.emoji;
}

export const TAILWIND_COLOR_PALETTES = {
  indigo: {
    name: "Индиго",
    bg: "bg-indigo-600",
    text: "text-indigo-600",
    hover: "hover:bg-indigo-700",
    light: "bg-indigo-50",
    border: "border-indigo-200",
    ring: "focus:ring-indigo-500",
    accent: "indigo"
  },
  amber: {
    name: "Янтарный",
    bg: "bg-amber-500",
    text: "text-amber-600",
    hover: "hover:bg-amber-600",
    light: "bg-amber-50",
    border: "border-amber-200",
    ring: "focus:ring-amber-500",
    accent: "amber"
  },
  rose: {
    name: "Розовый",
    bg: "bg-rose-500",
    text: "text-rose-600",
    hover: "hover:bg-rose-600",
    light: "bg-rose-50",
    border: "border-rose-200",
    ring: "focus:ring-rose-500",
    accent: "rose"
  },
  emerald: {
    name: "Изумрудный",
    bg: "bg-emerald-500",
    text: "text-emerald-600",
    hover: "hover:bg-emerald-600",
    light: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "focus:ring-emerald-500",
    accent: "emerald"
  },
  violet: {
    name: "Фиолетовый",
    bg: "bg-violet-600",
    text: "text-violet-600",
    hover: "hover:bg-violet-700",
    light: "bg-violet-50",
    border: "border-violet-200",
    ring: "focus:ring-violet-500",
    accent: "violet"
  },
  sky: {
    name: "Небесный",
    bg: "bg-sky-500",
    text: "text-sky-600",
    hover: "hover:bg-sky-600",
    light: "bg-sky-50",
    border: "border-sky-200",
    ring: "focus:ring-sky-500",
    accent: "sky"
  },
  orange: {
    name: "Оранжевый",
    bg: "bg-orange-500",
    text: "text-orange-600",
    hover: "hover:bg-orange-600",
    light: "bg-orange-50",
    border: "border-orange-200",
    ring: "focus:ring-orange-500",
    accent: "orange"
  }
};
