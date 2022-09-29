import type { Class } from "./Base";

export type ReportCardEventArgs = [reportCard: ReportCard | null];

export type ReportCardSixWeeksKeys =
  | "first"
  | "second"
  | "third"
  | "fourth"
  | "fifth"
  | "sixth"
  | "exam1"
  | "sem1"
  | "exam2"
  | "sem2";

export type ReportCardEntry = {
  class: Class;
  attendanceCredit: number;
  earnedCredit: number;
  averages: Record<ReportCardSixWeeksKeys, number | null> & {
    sem1: number | null;
    exam1: number | null;
    sem2: number | null;
    exam2: number | null;
  };
  comments: Record<
    Exclude<ReportCardSixWeeksKeys, "exam1" | "sem1" | "exam2" | "sem2">,
    string | null
  >;
};

export type ReportCard = {
  [className: string]: ReportCardEntry;
};
