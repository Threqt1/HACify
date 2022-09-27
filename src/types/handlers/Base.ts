export type Assignment = {
  dateDue: Date | null;
  dateAssigned: Date | null;
  assignment: string;
  category: string;
  score: Score;
  totalPoints: Score;
  dropped: boolean;
};

export type Class = {
  course: string;
  class: string;
  period: string;
  teacher: string;
  room: string;
};

export type MarkingPeriod = "M1" | "M2" | "M3" | "M4" | "M5" | "M6";
export type Day = "M" | "T" | "W" | "R" | "F";
export type Score = number | string | null;
