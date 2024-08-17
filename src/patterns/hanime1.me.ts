import { load } from "cheerio";
import { download, htmlOf } from "../util";

export namespace hanime1.me {
  export async function search(keyword: string, page: number) {
    await main(
      `https://hanime1.me/search?query=${keyword}&genre=%E8%A3%8F%E7%95%AA&page=${page}`,
    );
  }

  export async function main(urlOfEachPage: string) {
    const htmlOfEachPage = await htmlOf(urlOfEachPage);
    const eachPage = load(htmlOfEachPage);

    const urlsOfVideoDL: string[] = [];

    eachPage(".home-rows-videos-wrapper > a").each((_, e) => {
      urlsOfVideoDL.push(
        eachPage(e).attr("href")!.replace("watch", "download"),
      );
    });

    const videos = new Map<string, string>();

    await Promise.all(urlsOfVideoDL.map((u) => htmlOf(u))).then(
      (htmlsOfVideoDL) => {
        htmlsOfVideoDL.forEach((htmlOfVideoDL) => {
          const videoDL = load(htmlOfVideoDL);

          videos.set(
            `[${videoDL("p").text().substring(0, 10)}] ${videoDL("h3").text()}`,
            videoDL(".exoclick-popunder").first().attr("href") as string,
          );
        });
      },
    );

    for (const v of videos) await download(v[1], `${v[0]}.mp4`);
  }
}
