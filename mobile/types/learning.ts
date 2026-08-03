export type LessonCategory =
  | 'Стартап'
  | 'Бизнес'
  | 'Маркетинг'
  | 'Борлуулалт'
  | 'Санхүү'
  | 'Татвар'
  | 'Хууль'
  | 'Бүтээгдэхүүн'
  | 'Хөрөнгө оруулалт'
  | 'Манлайлал'
  | 'Багийн менежмент';

export type LessonDifficulty = 'Анхан' | 'Дунд' | 'Ахисан';

export type Lesson = {
  id: string;
  title: string;
  description: string;
  content: string;
  category: LessonCategory;
  difficulty: LessonDifficulty;
  durationMin: number;
};
