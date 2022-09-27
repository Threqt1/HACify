import type { Page } from "puppeteer";
import { BASE_ROUTE, CLASSWORK_ROUTE } from "../endpoints.js";
import * as cheerio from "cheerio/lib/slim";
import type {
  ClassworkClass,
  Classwork,
} from "../../types/handlers/Classwork.js";
import type {
  Handler,
  HandlerEventEmitter,
  HandlerRawEventEmitter,
} from "../../types/Handlers.js";

const EVENT = "classwork";

async function GetData(page: Page, emitter: HandlerRawEventEmitter) {
  await page.goto(BASE_ROUTE + CLASSWORK_ROUTE, {
    waitUntil: "load",
  });
  let currUrl = await page.url();
  if (currUrl !== BASE_ROUTE + CLASSWORK_ROUTE) emitter.emit(EVENT, null);
  await page.waitForSelector(".sg-hac-content");
  let firstOption: string = (await page.$eval(
    ".sg-hac-content .sg-content-grid .sg-container-content select option:nth-child(2)",
    (ele: any) => ele.value
  )) as string;
  let appendedItem = firstOption.split("-")[1];
  let stringCurrentIndex = (await page.$eval(
    ".sg-hac-content .sg-content-grid .sg-container-content .sg-combobox-wrapper input",
    (ele: any) => ele.value
  )) as string;
  let currentIndex = parseInt(stringCurrentIndex);
  let currentContent = await page.content();
  emitter.emit(EVENT, currentContent);
  for (let i = 1; i <= 6; i++) {
    if (i !== currentIndex) {
      await page.select(
        ".sg-hac-content .sg-content-grid .sg-container-content select",
        i + "-" + appendedItem
      );
      await Promise.all([
        page.click(
          ".sg-hac-content .sg-content-grid .sg-container-content button"
        ),
        page.waitForNavigation({
          waitUntil: "load",
        }),
        page.waitForSelector(".sg-hac-content"),
      ]);
      let content = await page.content();
      emitter.emit(EVENT, content);
    }
  }
}

async function ParseData(html: string, emitter: HandlerEventEmitter) {
  let $ = cheerio.load(html);
  let sixWeeks = $(
    ".sg-hac-content .sg-content-grid .sg-container-content .sg-combobox-wrapper input"
  )
    .attr("value")
    ?.trim();
  let classwork: Classwork = { sixWeeks: parseInt(sixWeeks!), classes: {} };
  $(".AssignmentClass").each(function (_, __) {
    let ele = $(this);
    let classTitleElem = ele
      .children(".sg-header")
      .children("a.sg-header-heading");
    let classTitle = classTitleElem.text().trim().split(" ");
    let classCourse = classTitle.slice(0, 3).join(" ").trim();
    let className = classTitle.slice(3).join(" ").trim();
    let avgGrade = ele
      .children(".sg-header")
      .children("span.sg-header-heading")
      .text()
      .trim()
      .split(" ")
      .reverse()[0]!
      .trim();
    let classData: ClassworkClass = {
      course: classCourse,
      class: className,
      avgGrade: avgGrade.length <= 0 ? null : parseInt(avgGrade),
      assignments: [],
    };
    ele
      .children(".sg-content-grid")
      .children("table")
      .children("tbody")
      .find("tr.sg-asp-table-data-row")
      .each(function (___, ____) {
        let row = $(this);
        let dateDue = row.children("td:nth-child(1)").text().trim();
        let dateAssigned = row.children("td:nth-child(2)").text().trim();
        let scoreElem = row.children("td:nth-child(5)");
        let score = scoreElem.text().trim();
        let totalPoints = row.children("td:nth-child(6)").text().trim();
        classData.assignments.push({
          dateDue: dateDue.length > 0 ? new Date(dateDue) : null,
          dateAssigned: dateAssigned.length > 0 ? new Date(dateAssigned) : null,
          assignment: row
            .children("td:nth-child(3)")
            .children("a")
            .text()
            .trim(),
          category: row.children("td:nth-child(4)").text().trim(),
          score:
            score.length <= 0
              ? null
              : isNaN(parseFloat(score))
              ? score
              : parseFloat(score),
          totalPoints:
            totalPoints.length <= 0
              ? null
              : isNaN(parseFloat(totalPoints))
              ? totalPoints
              : parseFloat(totalPoints),
          dropped: (scoreElem.attr("style") ?? "")
            .toLowerCase()
            .includes("line-through"),
        });
      });
    classwork.classes[className] = classData;
  });
  emitter.emit(EVENT, classwork);
}

const exported: Handler = {
  GetData,
  ParseData,
  rawEvent: EVENT,
  processedEvent: EVENT,
};

export default exported;
