import { io } from "./util";
import { hanime1 } from "./patterns/hanime1.me";
import { kemono } from "./patterns/kemono.su";

const task = {
  at: kemono.su,
  q: "2886368",
  pages: 5,
};

(async () => {
  for (let page = 1; page <= task.pages; page++) {
    await io(true);
    console.log(`正在下载第 ${page} 页内容：`);
    await task.at.search(task.q, page);
  }
  await io(false);
  console.log("任务已全部完成！");
})();
