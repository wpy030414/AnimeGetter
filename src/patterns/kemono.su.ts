import { load } from "cheerio";
import { download, htmlOf } from "../util";

export namespace kemono.su {
  export async function search(
    uid: string,
    page: number,
    platform: "fanbox" | "fantia" = "fanbox",
  ) {
    await main(
      `https://kemono.su/${platform}/user/${uid}?o=${(page - 1) * 50}`,
    );
  }

  export async function main(urlOfEachPage: string) {
    const htmlOfEachPage = await htmlOf(urlOfEachPage);
    const eachPage = load(htmlOfEachPage);

    const urlsOfPostDL: string[] = [];

    eachPage("article.post-card").each((_, e) => {
      urlsOfPostDL.push(
        `https://kemono.su${eachPage(e).children("a").attr("href")}`,
      );
    });

    const posts = new Map<string, string>();

    await Promise.all(urlsOfPostDL.map((u) => htmlOf(u))).then(
      (htmlsOfPostDL) => {
        htmlsOfPostDL.forEach((htmlOfPostDL) => {
          const postDL = load(htmlOfPostDL);

          postDL("li.post__attachment").each((_, e) => {
            const a = postDL(e).children("a:nth-child(1)");
            const time = postDL(".post__published")
              .text()
              .trim()
              .substring(11, 21);
            posts.set(
              `[${time}] ${a.text().trim().replace("Download ", "")}`,
              a.attr("href") as string,
            );
          });
        });
      },
    );

    for (const p of posts) await download(p[1], p[0]);
  }
}
