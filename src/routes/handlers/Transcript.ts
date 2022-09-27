import type { Page } from "puppeteer";
import * as cheerio from "cheerio/lib/slim";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";
import { BASE_ROUTE, TRANSCRIPT_ROUTE } from "../endpoints.js";
import type {
  Transcript,
  TranscriptPerSemester,
} from "../../types/handlers/Transcript.js";

const EVENT = "transcript";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + TRANSCRIPT_ROUTE, {
    waitUntil: "load",
  });
  let currUrl = await page.url();
  if (currUrl !== BASE_ROUTE + TRANSCRIPT_ROUTE) emitter.emit(EVENT, null);
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let transcript: Transcript = {
    transcripts: [],
    weighted: { type: "", gpa: null },
    unweighted: { type: "", gpa: null },
    rank: null,
    quartile: null,
  };
  let main_content = $(".sg-hac-content .sg-content-grid table");
  if (main_content.length <= 0) {
    emitter.emit("transcript", null);
    return;
  }
  main_content
    .children("tbody")
    .children("tr")
    .children("td")
    .each(function (_, __) {
      let td = $(this);
      if ((td.attr("class") ?? "").includes("sg-transcript-group")) {
        let SemTranscript: TranscriptPerSemester = {
          year: "",
          semester: 0,
          gradeLevel: 0,
          building: "",
          entries: [],
          totalCredit: 0,
        };
        let firstTable = td.children("table:nth-child(1)").children("tbody");
        let firstRow = firstTable.children("tr:nth-child(1)");
        let secondRow = firstTable.children("tr:nth-child(2)");
        SemTranscript.year = firstRow
          .children("td:nth-child(2)")
          .children("span")
          .text()
          .trim()
          .split(" ")[0]!
          .trim();
        SemTranscript.semester = parseInt(
          firstRow.children("td:nth-child(4)").children("span").text().trim()
        );
        SemTranscript.gradeLevel = parseInt(
          firstRow.children("td:nth-child(6)").children("span").text().trim()
        );
        SemTranscript.building = secondRow
          .children("td:nth-child(2)")
          .children("span")
          .text()
          .trim();
        td.children("table:nth-child(2)")
          .children("tbody")
          .children("tr.sg-asp-table-data-row")
          .each(function (_, __) {
            let row = $(this);
            let avg = parseInt(row.children("td:nth-child(3)").text().trim());
            let credit = parseFloat(
              row.children("td:nth-child(4)").text().trim()
            );
            SemTranscript.entries.push({
              class: {
                course: row.children("td:nth-child(1)").text().trim(),
                class: row.children("td:nth-child(2)").text().trim(),
              },
              avg: isNaN(avg) ? null : avg,
              credit: isNaN(credit) ? null : credit,
            });
          });
        let totalCredit = parseFloat(
          td
            .children("table:nth-child(3)")
            .children("tbody")
            .children("tr")
            .children("td:last-child")
            .children("label")
            .text()
            .trim()
        );
        SemTranscript.totalCredit = isNaN(totalCredit) ? 0.0 : totalCredit;
        transcript.transcripts.push(SemTranscript);
      } else {
        let table = td.children(".sg-asp-table");
        if (table.length > 0) {
          let weighted = table.children("tbody").children("tr:nth-child(2)");
          let unweighted = table.children("tbody").children("tr:nth-child(3)");
          let weightedGPA = parseFloat(
            weighted.children("td:nth-child(2)").children("span").text().trim()
          );
          let rank = parseInt(
            weighted.children("td:nth-child(3)").children("span").text().trim()
          );
          let quartile = parseInt(
            weighted.children("td:nth-child(4)").children("span").text().trim()
          );
          let unweightedGPA = parseFloat(
            unweighted
              .children("td:nth-child(2)")
              .children("span")
              .text()
              .trim()
          );
          transcript.weighted = {
            type: weighted
              .children("td:nth-child(1)")
              .children("span")
              .text()
              .trim(),
            gpa: isNaN(weightedGPA) ? null : weightedGPA,
          };
          transcript.unweighted = {
            type: weighted
              .children("td:nth-child(1)")
              .children("span")
              .text()
              .trim(),
            gpa: isNaN(unweightedGPA) ? null : unweightedGPA,
          };
          transcript.rank = isNaN(rank) ? null : rank;
          transcript.quartile = isNaN(quartile) ? null : quartile;
        }
      }
    });
  emitter.emit(EVENT, transcript);
}

let exports: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exports;
