import { Cluster } from "puppeteer-cluster";
import { Logon } from "./routes/handlers/Login.js";
import {
  ClassworkHandler,
  ScheduleHandler,
  IPRHandler,
  TranscriptsHandler,
  WeekViewHandler,
  ReportCardHandler,
} from "./routes/handlers.js";
import type { Page } from "puppeteer";
import {
  HandlerEventEmitter,
  HandlerMap,
  HandlerMapIndex,
  HandlerOptions,
  Handler,
  HandlerRawEventEmitter,
} from "./types/Handlers.js";

async function Redirect(_data: {
  page: Page;
  data: {
    emitter: HandlerEventEmitter;
    handler: Handler;
  };
}) {
  let { page, data } = _data;
  page.setRequestInterception(true);
  page.on("request", (req) => {
    let resourceType = req.resourceType();
    if (
      resourceType === "stylesheet" ||
      resourceType === "font" ||
      resourceType === "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
  let rawEmitter = new HandlerRawEventEmitter();
  rawEmitter.on(data.handler.rawEvent, (html) => {
    if (html === null) {
      data.emitter.emit(data.handler.processedEvent, null);
    } else {
      data.handler.ParseData(html, data.emitter);
    }
  });
  await data.handler.GetData(page, rawEmitter);
}

export class HACApi {
  #maps: HandlerMap = {
    classwork: ClassworkHandler,
    schedule: ScheduleHandler,
    ipr: IPRHandler,
    transcript: TranscriptsHandler,
    weekView: WeekViewHandler,
    reportCard: ReportCardHandler,
  };
  async GetData(
    user: string,
    pass: string,
    events: HandlerOptions = {
      login: true,
    },
    retryLimit: number = 0,
    timeout: number = 15 * 1000
  ) {
    if ((user ?? "").trim().length === 0 || (pass ?? "").trim().length === 0)
      throw new Error("[HACify] - Username or Password was an empty string!");
    let dataReciever = new HandlerEventEmitter();
    let cluster = await Cluster.launch({
      concurrency: Cluster.CONCURRENCY_PAGE,
      timeout,
      maxConcurrency: 6,
      puppeteerOptions: {
        headless: true,
        args: [
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--proxy-server='direct://'",
          "--proxy-bypass-list=*",
        ],
      },
      retryLimit,
      retryDelay: 100,
      workerCreationDelay: 100,
    });
    cluster.queue({ user, pass, dataReciever }, async ({ page, data }) => {
      page.setRequestInterception(true);
      page.on("request", (req) => {
        let resourceType = req.resourceType();
        if (
          resourceType === "stylesheet" ||
          resourceType === "font" ||
          resourceType === "image"
        ) {
          req.abort();
        } else {
          req.continue();
        }
      });
      let result = await Logon(data.user, data.pass, page);
      if (result === false) {
        if (events.login) data.dataReciever.emit("login", false);
        return;
      }
      if (events.login) data.dataReciever.emit("login", true);
      let eventsToRun = Object.keys(events).filter((r) => r !== "login");
      for (let key of eventsToRun) {
        let eventHandler = this.#maps[key as HandlerMapIndex];
        cluster.queue(
          {
            emitter: data.dataReciever,
            handler: eventHandler,
          },
          Redirect
        );
      }
    });
    cluster.idle().then(async () => {
      dataReciever.emit("done");
      await cluster.close();
      return;
    });
    return dataReciever;
  }
}
