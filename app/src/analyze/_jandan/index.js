var cheerio = require("cheerio");
var request = require("superagent");
var fs = require("fs");
var Promise = require('promise');
var http = require('http');
var schedule = require('node-schedule');

let url = "http://jandan.net/pic/page-";
let minPage = 1;
let maxPage = 0;
let getPicAsync = async(url) => {
    return await new Promise(function(resolve, reject) {
        request.get(url).end((err, res) => {
            if (err || !res.ok) {
                console.log(err);
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}
let filterHtml = async(html) => {
    let $ = cheerio.load(html);
    let imgPath = [];
    $(".righttext").each((index, element) => {
        $(element).next("p").children("img").each((index, element) => {
            let jpgPath = $(element).attr("src");
            let gifPath = $(element).attr("org_src");
            imgPath.push(gifPath ? gifPath : jpgPath);
        });
    });
    return imgPath;
}
let downLoadFile = async(page) => {
    getPicAsync(url + page).then(async(data) => {
        let imgs = await filterHtml(data.text);
        let indexFile = 0;
        if (imgs && imgs.length > 0) {
            imgs.forEach(img => {
                indexFile++;
                downOneFun(page, indexFile, img);
            });
        }
    });
}
let downOneFun = (page, index, url) => {
    let strLength = url.split(".");
    let fileType = strLength[strLength.length - 1];
    const savePath = "./app/src/analyze/_jandan/down-load/";
    // const stream = fs.createWriteStream(savePath);
    // const req = request.get("http:" + url);
    // req.type(fileType);
    // req.pipe(stream);
    request.get("http:" + url).end((err, res) => {
        if (res && res.body) {
            const saveFile = savePath + page + "_" + index + "." + fileType;
            fs.writeFileSync(saveFile, res.body);
            console.log(`DownLoad--[Page:${page}]--[Index:${index}]--Url:[${url}]--End`);
        } else {
            const saveFile = savePath + page + "_" + index + ".txt";
            fs.writeFileSync(saveFile, res + "------------" + "http:" + url);
            console.log(`DownLoad--[Page:${page}]--[Index:${index}]--Url:[${url}]--End--(failed)`);
        }
        minPage = page + 1;
    });
}
let downTwoFun = (page, index, url) => {
    console.log(`img--${index}--${url}`);
    let strLength = url.split(".");
    let fileType = strLength[strLength.length - 1];
    const savePath = "./app/src/analyze/_jandan/down-load/" + page + "_" + index + "." + fileType;

    http.get("http:" + url, (res) => {
        res.setEncoding("binary");
        res.on("end", (res) => {
            fs.writeFile(savePath, res.body, (err) => {
                console.log("123");
            });
        })
    });
}


let startUp = async() => {
    for (var index = minPage; index <= maxPage; index++) {
        await downLoadFile(index);
    }
}

var j = schedule.scheduleJob('*/1 * * * *', function() {
    maxPage = maxPage + 2;
    startUp();
});