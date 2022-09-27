import type { Assignment, Class } from "./Base";

export type ClassworkEventArgs = [classwork: Classwork];

export type ClassworkClass = Pick<Class, "class" | "course"> & {
  avgGrade: number | null;
  assignments: Assignment[];
};

export interface Classwork {
  sixWeeks: number;
  classes: {
    [className: string]: ClassworkClass;
  };
}
