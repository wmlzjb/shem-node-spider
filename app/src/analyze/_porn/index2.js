import axios from "axios";
import * as cheerio from "cheerio";
import * as Fs from "fs";
import * as Path from "path";
import { createWorker } from "tesseract.js";
import { createCanvas, loadImage } from "canvas";

const proxy = {
  host: "192.168.50.210",
  port: 17890,
};

const init = async () => {
  // const html = await axios.get("http://91porn.com/index.php", { proxy: proxy });
  // const html_login = await axios.get("http://91porn.com/login.php", {
  //   proxy: proxy,
  // });
  // const html_captcha = await axios.get("http://91porn.com/captcha.php", {
  //   proxy: proxy,
  //   responseType: "arraybuffer",
  // });

  // await wrHtml("demo.html", html.data);
  // await wrHtml("login.html", html_login.data);
  // await wrHtml("captcha.png", html_captcha.data);

  await getCaptchaStr();

  // const $ = cheerio.load(html_login.data);
  // let script = $("script").eq(14).html();
  // let fn = new Function(script);
  // let token = fn();
  // console.log(token);
};

const wrHtml = async (fileName, data) => {
  const filePath = Path.resolve(`./app/src/analyze/_porn/${fileName}`);
  if (await Fs.existsSync(filePath)) {
    await Fs.unlinkSync(filePath);
  }
  await Fs.writeFileSync(filePath, data, { encoding: "utf-8" });
};

const getCaptchaStr = async (callback) => {
  const img = Path.resolve("./app/src/analyze/_porn/captcha.png");
  const myimg = await loadImage(img);
  ProcessToGrayImage(myimg, myimg.getContext("2d"));

  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789",
  });
  const {
    data: { text },
  } = await worker.recognize(img);
  console.log(text);
  await worker.terminate();
};

const ProcessToGrayImage = (canvas, ctx) => {
  var imgData = ctx.getImageData(10, 10, 50, 50);
  var canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (var x = 0; x < canvasData.width; x++) {
    for (var y = 0; y < canvasData.height; y++) {
      var idx = (x + y * canvas.width) * 4;
      var r = canvasData.data[idx + 0];
      var g = canvasData.data[idx + 1];
      var b = canvasData.data[idx + 2];
      var gray = CalculateGrayValue(r, g, b);
      canvasData.data[idx + 0] = gray;
      canvasData.data[idx + 1] = gray;
      canvasData.data[idx + 2] = gray;
    }
  }
  ctx.putImageData(canvasData, 0, 0);
};

await init();
