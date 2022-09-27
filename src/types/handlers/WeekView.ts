import type { Assignment, Class, Day } from "./Base";

export type WeekViewEventArgs = [weekView: WeekView | null];

export type WeekViewAssignment = Pick<
  Assignment,
  "assignment" | "score" | "totalPoints"
>;

export type WeekViewClass = {
  class: Omit<Class, "room">;
  assignments: WeekViewAssignment[];
};

export type WeekViewDayEntry = {
  dayOff: boolean;
  classes: {
    [className: string]: WeekViewClass;
  };
};

export type WeekView = {
  [day in Day]: WeekViewDayEntry;
};
