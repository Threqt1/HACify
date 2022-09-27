import type { Class } from "./Base";

export type TranscriptEventArgs = [transcript: Transcript | null];

export type TranscriptEntry = {
  class: Pick<Class, "course" | "class">;
  avg: number | null;
  credit: number | null;
};

export type TranscriptPerSemester = {
  year: string;
  semester: number;
  gradeLevel: number;
  building: string;
  entries: TranscriptEntry[];
  totalCredit: number;
};

type GPA = {
  type: string;
  gpa: number | null;
};

export type Transcript = {
  transcripts: TranscriptPerSemester[];
  weighted: GPA;
  unweighted: GPA;
  rank: number | null;
  quartile: number | null;
};
