const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const { createWorker } = require("tesseract.js");
const { createCanvas, loadImage } = require("canvas");

async function init() {
  await getCaptchaStr();
}

async function wrHtml(fileName, data) {
  const filePath = path.resolve(`./app/src/analyze/_porn/${fileName}`);
  if (await fs.existsSync(filePath)) {
    await fs.unlinkSync(filePath);
  }
  await fs.writeFileSync(filePath, data, { encoding: "utf-8" });
}

async function getCaptchaStr(callback) {
  const img = path.resolve("./app/src/analyze/_porn/captcha.png");
  //   await processToGrayImage(img);
  //   await simpleGrayImage(img);
  await toHex(img);

  const newImg = path.resolve("./app/src/analyze/_porn/canvas.png");
  const worker = createWorker();
  await worker.load();
  await worker.loadLanguage("eng");
  await worker.initialize("eng");
  await worker.setParameters({
    tessedit_char_whitelist: "0123456789",
  });
  const {
    data: { text },
  } = await worker.recognize(newImg);
  console.log(text);
  await worker.terminate();
}

//彩色图像灰度化
async function processToGrayImage(path) {
  const myimg = await loadImage(path);
  const canvas = createCanvas(myimg.width, myimg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(myimg, 0, 0);
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //这个循环是取得图像的每一个点，在计算灰度后将灰度设置给原图像
  for (let x = 0; x < canvasData.width; x++) {
    for (let y = 0; y < canvasData.height; y++) {
      // Index of the pixel in the array
      const idx = (x + y * canvas.width) * 4;
      // The RGB values
      const r = canvasData.data[idx + 0];
      const g = canvasData.data[idx + 1];
      const b = canvasData.data[idx + 2];
      //更新图像数据
      const gray = calculateGrayValue(r, g, b);
      canvasData.data[idx + 0] = gray;
      canvasData.data[idx + 1] = gray;
      canvasData.data[idx + 2] = gray;
    }
  }
  ctx.putImageData(canvasData, 0, 0);
  canvas
    .createPNGStream()
    .pipe(fs.createWriteStream(path.replace("captcha", "canvas")));
}

//计算图像的灰度值,公式为：Gray = R*0.299 + G*0.587 + B*0.114
function calculateGrayValue(rValue, gValue, bValue) {
  //   return parseInt(rValue * 0.299 + gValue * 0.587 + bValue * 0.114);
  if (rValue + gValue + bValue > 150) {
    return 0;
  } else {
    return 255;
  }
}

async function simpleGrayImage(path) {
  const myimg = await loadImage(path);
  const canvas = createCanvas(myimg.width, myimg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(myimg, 0, 0);
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let data = canvasData.data;
  for (let i = 0; i < data.length; i++) {
    var avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    data[i] = avg;
    data[i + 1] = avg;
    data[i + 2] = avg;
  }
  ctx.putImageData(canvasData, 0, 0);
  canvas
    .createPNGStream()
    .pipe(fs.createWriteStream(path.replace("captcha", "canvas_simple")));
}

// 二值化图像
async function toHex(path) {
  const myimg = await loadImage(path);
  const canvas = createCanvas(myimg.width, myimg.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(myimg, 0, 0);
  const canvasData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const WIDTH = canvas.width;
  const HEIGHT = canvas.height;
  const fromPixelData = canvasData.data;
  let greyAve = 0;
  for (let j = 0; j < WIDTH * HEIGHT; j++) {
    const r = fromPixelData[4 * j];
    const g = fromPixelData[4 * j + 1];
    const b = fromPixelData[4 * j + 2];
    greyAve += r * 0.3 + g * 0.59 + b * 0.11;
  }
  greyAve /= WIDTH * HEIGHT; //计算平均灰度值。
  for (j = 0; j < WIDTH * HEIGHT; j++) {
    r = fromPixelData[4 * j];
    g = fromPixelData[4 * j + 1];
    b = fromPixelData[4 * j + 2];
    let grey = r * 0.333 + g * 0.333 + b * 0.333; //取平均值。
    grey = grey > greyAve ? 255 : 0;
    fromPixelData[4 * j] = grey;
    fromPixelData[4 * j + 1] = grey;
    fromPixelData[4 * j + 2] = grey;
  }
  corrode(fromPixelData);
  expand(fromPixelData);

  ctx.putImageData(canvasData, 0, 0);
  canvas
    .createPNGStream()
    .pipe(fs.createWriteStream(path.replace("captcha", "canvas_simple")));
}

//腐蚀（简单）
function corrode(fromArray) {
  for (var j = 1; j < fromArray.length - 1; j++) {
    for (var k = 1; k < fromArray[j].length - 1; k++) {
      if (
        fromArray[j][k] == 1 &&
        fromArray[j - 1][k] +
          fromArray[j + 1][k] +
          fromArray[j][k - 1] +
          fromArray[j][k + 1] ==
          0
      ) {
        fromArray[j][k] = 0;
      }
    }
  }
  return fromArray;
}

//膨胀（简单）
function expand(fromArray) {
  for (var j = 1; j < fromArray.length - 1; j++) {
    for (var k = 1; k < fromArray[j].length - 1; k++) {
      if (
        fromArray[j][k] == 0 &&
        fromArray[j - 1][k] +
          fromArray[j + 1][k] +
          fromArray[j][k - 1] +
          fromArray[j][k + 1] ==
          4
      ) {
        fromArray[j][k] = 1;
      }
    }
  }
  return fromArray;
}

init();
