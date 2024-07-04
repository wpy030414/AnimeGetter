import { load } from "cheerio";
import puppeteer from "puppeteer";
import { writeFile } from "fs";
const download = require("download");

function url(page: number): string {
  return `https://hanime1.me/search?genre=%E8%A3%8F%E7%95%AA&page=${page}`;
}

const headers = {
  Cookie:
    "XSRF-TOKEN=eyJpdiI6ImhKM2M5NTIrQWE2VE96U0tEWDRwbFE9PSIsInZhbHVlIjoicmVtbnBzeExXU3lCUzhRKzViYXFONXNZczg4eWFyNUxnUFFRNDExaUFWYktvSk9wSlo2T3YrZ0czM1B3OEdMcCIsIm1hYyI6IjVjNmMzNGYwNmNhMDhlYzYzMDdkOGEyZmQwNjMyMDI1OTc3ZTcxNDZhMDFlMWI4ZDk0YTM2YzFjODk2M2U1NDQifQ%3D%3D; hanime1_session=eyJpdiI6IktPMEU4bWhFQVNsektVVkFzaktuWFE9PSIsInZhbHVlIjoiNUtpV2IrZ1lQdHU2eWhjeWphZWl4d1FId1JMRDJKemxuRkhJSmpyQVVqRFkzN0VRdFNDam1lXC9Zd2dseFhJZ0MiLCJtYWMiOiI0MWQ3MTJhMzJiNzRlZTU3YWU1ZjVlZGVmZjFkNjUwNWM3OGI2NTNlN2U2ZGYzZGZmMWRkYTkzODgzOWVhYTZjIn0%3D; _ga_2JNTSFQYRQ=GS1.1.1720081329.1.1.1720083291.0.0.0; _ga=GA1.1.950628038.1720081330; _gid=GA1.2.868905383.1720081335; cf_clearance=H2tUheMpogkQLoXxRfPz.TzfM9Xo4DAThaZ4DvE871g-1720083220-1.0.1.1-VSRCqh9HdKfRgMOJw98VTLSyJE6mTvZLFNgoeHTYLhA1U.yERkl4igtr4UZViUCUw1slJH7BE9JPfLKDLRPdPQ",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
};

async function html(url: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setExtraHTTPHeaders(headers);

  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForSelector("body");

  const content = await page.evaluate(() => {
    return document.body.innerHTML;
  });

  await browser.close();

  return content;
}

async function fetchVideoLinks(urlOfEachPage: string) {
  const htmlOfEachPage = await html(urlOfEachPage);
  const eachPage = load(htmlOfEachPage);

  const urlsOfVideoDL: string[] = [];

  eachPage(".home-rows-videos-wrapper > a").each((i, e) => {
    urlsOfVideoDL.push(eachPage(e).attr("href")!.replace("watch", "download"));
  });

  const videos = new Map<string, string>();

  await Promise.all(urlsOfVideoDL.map((u) => html(u))).then(
    (htmlsOfVideoDL) => {
      htmlsOfVideoDL.forEach((htmlOfVideoDL) => {
        const videoDL = load(htmlOfVideoDL);

        videos.set(
          `[${videoDL("p").text().substring(0, 10)}] ${videoDL("h3").text()}`,
          videoDL(".exoclick-popunder").first().attr("href") as string
        );
      });
    }
  );

  console.log(videos);
  for (const v of videos)
    writeFile(`downloads/${v[0]}.mp4`, await download(v[1]), (err) => {
      if (err) {
        console.error("写入文件时发生错误：", err);
      } else {
        console.log("文件写入成功！");
      }
    });
}

for (let page = 1; page <= 10; page++) fetchVideoLinks(url(page));
