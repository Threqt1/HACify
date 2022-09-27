import type { Assignment, Class } from "./Base";

export type ClassworkEventArgs = [classwork: Classwork | null];

export type ClassworkClass = Pick<Class, "class" | "course"> & {
  avgGrade: number | null;
  assignments: Assignment[];
};

export type Classwork = {
  sixWeeks: number;
  classes: {
    [className: string]: ClassworkClass;
  };
};
