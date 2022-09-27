import type { Class, Day, MarkingPeriod } from "./Base";

export type ScheduleEventArgs = [schedule: Schedule | null];

export type ScheduleClass = {
  class: Class;
  days: Day[];
  markingPeriods: MarkingPeriod[];
  building: string;
  status: boolean;
};

export interface Schedule {
  semester: number;
  schedule: ScheduleClass[];
}
