var cheerio = require("cheerio");
var request = require("superagent");
var fs = require("fs");

for (var index = 0; index < 20; index++) {
    const savePath = "./app/src/analyze/_weifeng/down-load/" + index + ".jpg";
    const stream = fs.createWriteStream(savePath);
    const req = request.get("http://resource.feng.com/resource/h061/h62/img201703292238160.jpg");
    req.pipe(stream);
}