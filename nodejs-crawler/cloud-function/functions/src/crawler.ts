import * as puppeteer from "puppeteer";
import { ArticleType } from "./types";
import { Database, db } from "./firebase";

export default class Crawler {
  async initBrowser() {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--single-process",
        "--proxy-server='direct://'",
        "--proxy-bypass-list=*",
        "--deterministic-fetch",
      ],
    });
    return browser;
  }

  async scraping(page: puppeteer.Page, keyword: string) {
    await page.goto(`https://medium.com/tag/${keyword}/recommended`, {
      waitUntil: "domcontentloaded",
    });

    return this.getRecommendArticles(page);
  }

  async start() {
    const firestore = new Database(db);
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    const keywordResults = await firestore.getAllData("keywords");

    let articles: ArticleType[] = [];

    for (const result of keywordResults) {
      const _article = await this.scraping(page, result.keyword);
      console.log(_article);
      const mergeKeyword = _article.map((ar) => ({
        ...ar,
        keyword: result.keyword,
      }));

      articles.push(...mergeKeyword);
    }

    // insert data
    const result = await Promise.all(
      articles.map(async (article) => {
        const checkExist = await firestore.getData(
          "article",
          "title",
          article.title as string
        );

        if (checkExist.length > 0) {
          return null;
        } else {
          const doc = await firestore.addData("articles", article);
          return doc.id;
        }
      })
    );

    console.log(result);

    await browser.close();
  }

  getRecommendArticles = async (page: puppeteer.Page) => {
    return page.evaluate(() => {
      const elements = document.querySelectorAll(
        "article div.l.er.ib > a:nth-child(1), article h2, article h3, article div.h > img, article div.ht > div > div.bl > a > p, article div.l > img"
      );
      // const linkEl = document.querySelectorAll(
      //   "article div.l.er.ib > a:nth-child(1)"
      // );
      // const titleEl = document.querySelectorAll("article h2");
      // const descriptionEl = document.querySelectorAll("article h3");
      // const mainImageEl = document.querySelectorAll("article div.h > img");
      // const avatarEl = document.querySelectorAll("article div.l > img");
      // const editorEl = document.querySelectorAll(
      //   "article div.ht > div > div.bl > a > p"
      // );

      const articles: ArticleType[] = [];

      let obj: ArticleType = {};

      function checkObjectKey<T>(obj: T, key: keyof T) {
        if (obj[key] === undefined) {
          return true;
        } else {
          return false;
        }
      }

      function setObjectKey<T>(obj: T, key: keyof T, value: T[keyof T]) {
        if (checkObjectKey<T>(obj, key)) {
          obj[key] = value;
        } else {
          resetObject();
        }
      }

      function resetObject() {
        articles.push(obj);
        obj = {};
      }

      elements.forEach((element) => {
        switch (element.nodeName) {
          case "A":
            setObjectKey(obj, "link", (element as any)?.href);
            break;
          case "IMG":
            if (element.className === "l hs bx hn ho ec") {
              setObjectKey(obj, "avatarImageUrl", (element as any)?.src);
            } else if (element.className === "bw lh") {
              obj.mainImageUrl = (element as any)?.src;
              setObjectKey(obj, "mainImageUrl", (element as any)?.src);
            }
            break;
          case "H2":
            setObjectKey(obj, "title", element.innerHTML);
            break;
          case "H3":
            setObjectKey(obj, "description", element.innerHTML);
            break;
          case "P":
            setObjectKey(obj, "editor", element.innerHTML);
            break;
          default:
            break;
        }
      });
      return articles;
    });
  };
}
