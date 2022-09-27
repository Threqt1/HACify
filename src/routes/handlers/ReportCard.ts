import type { Page } from "puppeteer";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";
import { BASE_ROUTE, REPORT_CARD_ROUTE } from "../endpoints.js";

const EVENT = "reportCard";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  emitter;
  await page.goto(BASE_ROUTE + REPORT_CARD_ROUTE, {
    waitUntil: "load",
  });
  let currUrl = await page.url();
  if (currUrl !== BASE_ROUTE + REPORT_CARD_ROUTE) emitter.emit(EVENT, null);
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

async function ParseData(_html: string, _emitter: HandlerEventEmitter) {}

let exports: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exports;
