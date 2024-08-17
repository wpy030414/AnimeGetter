import { Browser, launch } from "puppeteer";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { headers, rpc } from "./option";

let browser: Browser;

export async function io(on: boolean) {
  if (browser) await browser.close();
  if (on) browser = await launch();
}

export async function htmlOf(url: string) {
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on("request", (request) => {
    if (
      request.url().endsWith(".png") ||
      request.url().endsWith(".jpg") ||
      request.url().endsWith(".jpeg") ||
      request.url().endsWith(".gif")
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

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
    logger(`任务跳过："${filename}"`);
    return;
  }

  const response = await fetch(`${rpc.host}:${rpc.port}${rpc.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: new Date().getTime(),
      jsonrpc: "2.0",
      method: "aria2.addUri",
      params: [
        `token:${rpc.token}`,
        [url],
        {
          dir: join(__dirname, "../downloads"),
          out: filename,
        },
      ],
    }),
  });

  if (response.ok) {
    logger(`任务已部署："${filename}"`);
  } else {
    logger(`任务部署失败："${filename}"`);
  }
}
