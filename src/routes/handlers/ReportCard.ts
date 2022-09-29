import type { Page } from "puppeteer";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";
import * as cheerio from "cheerio/lib/slim";
import { BASE_ROUTE, REPORT_CARD_ROUTE } from "../endpoints.js";
import type {
  ReportCard,
  ReportCardEntry,
  ReportCardSixWeeksKeys,
} from "../../types/handlers/ReportCard.js";

const EVENT = "reportCard";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + REPORT_CARD_ROUTE, {
    waitUntil: "load",
  });
  let currUrl = await page.url();
  if (currUrl !== BASE_ROUTE + REPORT_CARD_ROUTE) emitter.emit(EVENT, null);
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

const AVGS_KEY_ARR_MAP: ReportCardSixWeeksKeys[] = [
  "first",
  "second",
  "third",
  "exam1",
  "sem1",
  "fourth",
  "fifth",
  "sixth",
  "exam2",
  "sem2",
];

const COMS_KEY_ARR_MAP: Exclude<
  ReportCardSixWeeksKeys,
  "exam1" | "sem1" | "exam2" | "sem2"
>[] = ["first", "second", "third", "fourth", "fifth", "sixth"];

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let main_content = $(
    ".sg-hac-content .sg-content-grid .sg-content-grid .sg-asp-table"
  );
  if (main_content.length <= 0) {
    emitter.emit(EVENT, null);
    return;
  }
  let reportCard: ReportCard = {};
  main_content
    .children("tbody")
    .children(".sg-asp-table-data-row")
    .each(function (_, __) {
      let row = $(this);
      let className = row
        .children("td:nth-child(2)")
        .children("a")
        .text()
        .trim();
      let reportCardEntry: ReportCardEntry = {
        class: {
          course: row.children("td:nth-child(1)").text().trim(),
          class: className,
          period: row.children("td:nth-child(3)").text().trim(),
          teacher: row.children("td:nth-child(4)").children("a").text().trim(),
          room: row.children("td:nth-child(5)").text().trim(),
        },
        attendanceCredit: parseFloat(
          row.children("td:nth-child(6)").text().trim()
        ),
        earnedCredit: parseFloat(row.children("td:nth-child(7)").text().trim()),
        averages: {
          first: null,
          second: null,
          third: null,
          exam1: null,
          sem1: null,
          fourth: null,
          fifth: null,
          sixth: null,
          exam2: null,
          sem2: null,
        },
        comments: {
          first: null,
          second: null,
          third: null,
          fourth: null,
          fifth: null,
          sixth: null,
        },
      };
      for (let i = 8; i <= 17; i++) {
        let num = parseInt(
          row
            .children("td:nth-child(" + i + ")")
            .children("a")
            .text()
            .trim()
        );
        reportCardEntry.averages[AVGS_KEY_ARR_MAP[i - 8]!] = isNaN(num)
          ? null
          : num;
      }
      for (let i = 18; i <= 23; i++) {
        let comm = row
          .children("td:nth-child(" + i + ")")
          .children("a")
          .text()
          .trim();
        reportCardEntry.comments[COMS_KEY_ARR_MAP[i - 18]!] =
          comm.length === 0 ? null : comm;
      }
      reportCard[className] = reportCardEntry;
    });
  emitter.emit(EVENT, reportCard);
}

let exports: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exports;
