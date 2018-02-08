var request = require("superagent");
var schedule = require('node-schedule');

let jobCount = 0;
let url = `https://recommender-api-ms.juejin.im/v1/get_recommended_entry?suid=VvrQevzfjZUEM6IQbnUU&ab=welcome_3&src=web`;

let getList = async () => {
    return await new Promise((resolve, reject) => {
        request.get(url).end((err, res) => {
            if (err || !res.ok) {
                console.log(err.text);
                reject(err);
            } else {
                resolve(JSON.parse(res.text));
            }
        });
    });
}

var rule = new schedule.RecurrenceRule();
rule.second = [0, 10, 20, 30, 40, 50];
let j = schedule.scheduleJob(rule, () => {
    if (jobCount === 5) {
        j.cancel();
        return false;
    }
    getList().then(data => {
        let list = [];
        data.d.forEach(item => {
            const obj = {
                categoryName: item.category.name,
                categoryTitle: item.category.title,
                collectionCount: item.collectionCount,
                content: item.content,
                createdDate: item.createdAt,
                hot: item.hot,
                hotIndex: item.hotIndex,
                postId: item.objectId,
                original: item.original,
                originalUrl: item.originalUrl,
                rankIndex: item.rankIndex,
                screenshot: item.screenshot,
                subscribersCount: item.subscribersCount,
                title: item.title,
                type: item.type,
                viewsCount: item.viewsCount,
                commentsCount: item.commentsCount
            };
            list.push({ method: 'post', path: '/1/classes/shem_juejin', body: obj });
        });

        request.post('https://api.bmob.cn/1/batch', { requests: list })
            .set('X-Bmob-Application-Id', '75700841fb52cb6a078f861df2a5bbc3')
            .set('X-Bmob-REST-API-Key', '7d536b0f8e4fcda96529aee305e05439')
            .set('Content-Type', 'application/json')
            .end((err, res) => {
                if (err || !res.ok) {
                    console.log(err);
                } else {
                    console.log('新增一行数据', list.length);
                }
            });

        jobCount++;
    });
});