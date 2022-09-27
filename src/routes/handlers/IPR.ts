import type { Page } from "puppeteer";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";
import { BASE_ROUTE, IPR_ROUTE } from "../endpoints.js";
import * as cheerio from "cheerio/lib/slim";
import type { IPR } from "../../types/handlers/IPR.js";

const EVENT = "ipr";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + IPR_ROUTE, {
    waitUntil: "load",
  });
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let main_content = $(
    ".sg-hac-content .sg-content-grid .sg-content-grid .sg-asp-table"
  );
  if (main_content.length <= 0) {
    emitter.emit(EVENT, null);
    return;
  } else {
    let progressReport: IPR = { reports: [] };
    main_content
      .children("tbody")
      .find("tr.sg-asp-table-data-row")
      .each(function (_, __) {
        let row = $(this);
        let prg = row.children("td:nth-child(6)").text().trim();
        progressReport.reports.push({
          class: {
            course: row.children("td:nth-child(1)").text().trim(),
            class: row.children("td:nth-child(2)").children("a").text().trim(),
            period: row.children("td:nth-child(3)").text().trim(),
            teacher: row
              .children("td:nth-child(4)")
              .children("a")
              .text()
              .trim(),
            room: row.children("td:nth-child(5)").text().trim(),
          },
          prg: prg.length <= 0 ? null : parseInt(prg),
        });
      });
    emitter.emit(EVENT, progressReport);
  }
}

const exported: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exported;
