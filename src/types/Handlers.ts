import { EventEmitter } from "events";
import type { Page } from "puppeteer";
import type { ClassworkEventArgs } from "./handlers/Classwork";
import type { IPREventArgs } from "./handlers/IPR";
import type { ReportCardEventArgs } from "./handlers/ReportCard";
import type { ScheduleEventArgs } from "./handlers/Schedule";
import type { TranscriptEventArgs } from "./handlers/Transcript";
import type { WeekViewEventArgs } from "./handlers/WeekView";

export type HandlerEvents = {
  login: [status: boolean];
  classwork: ClassworkEventArgs;
  schedule: ScheduleEventArgs;
  ipr: IPREventArgs;
  transcript: TranscriptEventArgs;
  weekView: WeekViewEventArgs;
  reportCard: ReportCardEventArgs;
  done: [];
};

type HandlerRawEvents = Omit<HandlerEvents, "login" | "done">;

export type HandlerOptions = Partial<
  Record<keyof Omit<HandlerEvents, "done">, boolean>
>;

export class HandlerRawEventEmitter extends EventEmitter {
  constructor() {
    super();
  }

  public override emit<K extends keyof HandlerRawEvents>(
    eventName: K,
    ...args: [html: string | null]
  ): boolean {
    return super.emit(eventName, ...args);
  }

  public override on<K extends keyof HandlerRawEvents>(
    eventName: K,
    listener: (...args: [html: string | null]) => void
  ): this {
    return super.on(eventName, listener);
  }

  public override once<K extends keyof HandlerRawEvents>(
    eventName: K,
    listener: (...args: [html: string | null]) => void
  ): this {
    return super.once(eventName, listener);
  }

  public override addListener<K extends keyof HandlerRawEvents>(
    eventName: K,
    listener: (...args: [html: string | null]) => void
  ): this {
    return super.addListener(eventName, listener);
  }
}

export class HandlerEventEmitter extends EventEmitter {
  constructor() {
    super();
  }

  public override emit<K extends keyof HandlerEvents>(
    eventName: K,
    ...args: HandlerEvents[K]
  ): boolean {
    return super.emit(eventName, ...args);
  }

  public override on<K extends keyof HandlerEvents>(
    eventName: K,
    listener: (...args: HandlerEvents[K]) => void
  ): this {
    return super.on(eventName, listener as (...args: any[]) => void);
  }

  public override once<K extends keyof HandlerEvents>(
    eventName: K,
    listener: (...args: HandlerEvents[K]) => void
  ): this {
    return super.once(eventName, listener as (...args: any[]) => void);
  }

  public override addListener<K extends keyof HandlerEvents>(
    eventName: K,
    listener: (...args: HandlerEvents[K]) => void
  ): this {
    return super.addListener(eventName, listener as (...args: any[]) => void);
  }
}

export type Handler = {
  GetData: (page: Page, emitter: HandlerRawEventEmitter) => Promise<void>;
  ParseData: (html: string, emitter: HandlerEventEmitter) => Promise<void>;
  rawEvent: keyof HandlerRawEvents;
  processedEvent: keyof HandlerOptions;
};

export type HandlerMapIndex = keyof Omit<HandlerOptions, "login" | "done">;
export type HandlerMap = Record<HandlerMapIndex, Handler>;
