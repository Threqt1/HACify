import type { Page } from "puppeteer";
import { BASE_ROUTE, LOGIN_ROUTE } from "../endpoints.js";

export async function Logon(user: string, pass: string, page: Page) {
  await page.goto(BASE_ROUTE + LOGIN_ROUTE);
  await page.waitForSelector("#LogOnDetails_UserName");
  await page.type("#LogOnDetails_UserName", user);
  await page.type("#LogOnDetails_Password", pass);
  await page.click("#login");
  return new Promise((res) => {
    page.once("framenavigated", (resp) => {
      res(resp.url() !== BASE_ROUTE + LOGIN_ROUTE);
    });
  });
}
