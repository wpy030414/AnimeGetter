import { Browser, launch } from "puppeteer";
import { createWriteStream, existsSync, mkdirSync } from "fs";
import { headers } from "./option";
import { pipeline } from "stream/promises";

let browser: Browser;

export async function io(on: boolean) {
  if (browser) await browser.close();
  if (on) browser = await launch();
}

export async function htmlOf(url: string) {
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders(headers);
  await page.goto(url, { waitUntil: "networkidle2" });
  await page.waitForSelector("body");

  return await page.evaluate(() => document.body.innerHTML);
}

function logger(msg: string) {
  console.log(`[${new Date().toISOString()}] - ${msg}`);
}

export async function download(url: string, filename: string) {
  const dir = "downloads";
  mkdirSync(dir, { recursive: true });

  filename = filename.replace(/[<>:"/\\|?*]+/g, "");

  if (existsSync(`${dir}/${filename}`)) {
    logger(`下载跳过："${filename}"`);
    return;
  }

  const response = await fetch(url);

  if (!response.ok) {
    logger(`下载失败："${filename}"`);
    return;
  }

  await pipeline(response.body as any, createWriteStream(`${dir}/${filename}`));
  return logger(`下载成功："${filename}"`);
}
