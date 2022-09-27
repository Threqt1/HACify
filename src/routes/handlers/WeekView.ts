import type { Page } from "puppeteer";
import * as cheerio from "cheerio/lib/slim";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers";
import { BASE_ROUTE, WEEK_VIEW_ROUTE } from "../endpoints.js";
import type {
  WeekView,
  WeekViewAssignment,
  WeekViewClass,
} from "../../types/handlers/WeekView";
import type { Class, Day, Score } from "../../types/handlers/Base";

const EVENT = "weekView";

const NUM_TO_DAY_MAP: {
  [index: number]: Day;
} = {
  2: "M",
  3: "T",
  4: "W",
  5: "R",
  6: "F",
};

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + WEEK_VIEW_ROUTE, {
    waitUntil: "load",
  });
  await page.waitForSelector(".sg-hac-content");
  let content = await page.content();
  emitter.emit(EVENT, content);
}

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let weekView: WeekView = {
    M: {
      dayOff: false,
      classes: {},
    },
    T: {
      dayOff: false,
      classes: {},
    },
    W: {
      dayOff: false,
      classes: {},
    },
    R: {
      dayOff: false,
      classes: {},
    },
    F: {
      dayOff: false,
      classes: {},
    },
  };
  let main_content = $(".sg-hac-content .sg-content-grid .sg-asp-table");
  if (main_content.length <= 0) {
    emitter.emit(EVENT, null);
    return;
  }
  main_content
    .children("tbody")
    .children("tr")
    .each(function (_, __) {
      let row = $(this);
      let classTd = row.children("td:nth-child(1)").children("div");
      let weekClass: Omit<Class, "room"> = {
        class: classTd.children("a#courseName").text().trim(),
        course: classTd
          .children("div")
          .children("span:first-child")
          .text()
          .trim()
          .slice(1, -1)
          .replace(/ {2,}/g, " "),
        period: classTd
          .children("div")
          .children("span:last-child")
          .text()
          .trim()
          .split(" ")[1]!
          .trim(),
        teacher: classTd.children("a#staffName").text().trim(),
      };
      for (let i = 2; i <= 6; i++) {
        if (weekView[NUM_TO_DAY_MAP[i]!].dayOff) continue;
        let dayTd = row.children("td:nth-child(" + i + ")");
        if (
          (dayTd.attr("class") ?? "").includes("sg-home-table-cell-disabled")
        ) {
          weekView[NUM_TO_DAY_MAP[i]!].dayOff = true;
          continue;
        }
        let weekViewClass: WeekViewClass = {
          class: weekClass,
          assignments: [],
        };
        let assignments = dayTd
          .children(".sg-att-table-cell")
          .children(".sg-clearfix");
        if (assignments.length > 0) {
          assignments.each(function (_, __) {
            let assignment = $(this).children("span");
            let weekViewAssignment: WeekViewAssignment = {
              assignment: assignment.children("a").text().trim(),
              score: null,
              totalPoints: null,
            };
            let score = assignment.children("span.sg-right");
            if (score.length > 0) {
              let scoreText = score.text().trim().split("/");
              let scoreEarned: Score = parseFloat(scoreText[0]!.trim());
              let scoreTotal: Score = parseFloat((scoreText[1] ?? "").trim());
              if (isNaN(scoreEarned))
                scoreEarned =
                  scoreText[0]!.trim().length === 0
                    ? null
                    : scoreText[0]!.trim();
              if (isNaN(scoreTotal)) scoreTotal = null;
              weekViewAssignment.score = scoreEarned;
              weekViewAssignment.totalPoints = scoreTotal;
            }
            weekViewClass.assignments.push(weekViewAssignment);
          });
        }
        let exists = weekView[NUM_TO_DAY_MAP[i]!].classes[weekClass.class];
        if (exists) {
          exists.assignments = exists.assignments.concat(
            weekViewClass.assignments
          );
        } else {
          weekView[NUM_TO_DAY_MAP[i]!].classes[weekClass.class] = weekViewClass;
        }
      }
    });
  emitter.emit(EVENT, weekView);
}

let exports: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exports;
