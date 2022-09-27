import type { Class } from "./Base";

export type IPREventArgs = [report: IPR | null];

type IPRClass = {
  class: Class;
  prg: number | null;
};

export type IPR = {
  reports: IPRClass[];
};
