import type { Page } from "puppeteer";
import { BASE_ROUTE, SCHEDULE_ROUTE } from "../endpoints.js";
import * as cheerio from "cheerio/lib/slim";
import type { Schedule, ScheduleClass } from "../../types/handlers/Schedule.js";
import type { Day, MarkingPeriod } from "../../types/handlers/Base.js";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";

const EVENT = "schedule";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + SCHEDULE_ROUTE, {
    waitUntil: "load",
  });
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

const SEM_1_MARKING_PERS: MarkingPeriod[] = ["M1", "M2", "M3"];
const SEM_2_MARKING_PERS: MarkingPeriod[] = ["M4", "M5", "M6"];

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let allClasses: ScheduleClass[] = [];
  let main_content = $(".sg-hac-content .sg-content-grid .sg-asp-table");
  if (main_content.length <= 0) {
    emitter.emit(EVENT, null);
    return;
  }
  main_content
    .children("tbody")
    .find("tr.sg-asp-table-data-row")
    .each(function (_, __) {
      let row = $(this);
      allClasses.push({
        class: {
          course: row.children("td:nth-child(1)").text().trim(),
          class: row.children("td:nth-child(2)").children("a").text().trim(),
          period: row.children("td:nth-child(3)").text().trim(),
          teacher: row.children("td:nth-child(4)").children("a").text().trim(),
          room: row.children("td:nth-child(5)").text().trim(),
        },
        days: row
          .children("td:nth-child(6)")
          .text()
          .trim()
          .split(", ")
          .map((r) => r.trim().toUpperCase()) as Day[],
        markingPeriods: row
          .children("td:nth-child(7)")
          .text()
          .trim()
          .split(", ")
          .map((r) => r.trim().toUpperCase()) as MarkingPeriod[],
        building: row.children("td:nth-child(8)").text().trim(),
        status:
          row.children("td:nth-child(9)").text().trim().toLowerCase() ===
          "active",
      });
    });
  let sem1: Schedule = {
    semester: 1,
    schedule: allClasses.filter((r) =>
      r.markingPeriods.some((r) => SEM_1_MARKING_PERS.includes(r))
    ),
  };
  let sem2: Schedule = {
    semester: 2,
    schedule: allClasses.filter((r) =>
      r.markingPeriods.some((r) => SEM_2_MARKING_PERS.includes(r))
    ),
  };
  emitter.emit(EVENT, sem1);
  emitter.emit(EVENT, sem2);
}

const exported: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exported;
