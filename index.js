var express = require('express');
var bodyParser = require('body-parser');
var request = require('request-promise');
var morgan = require('morgan');
var cheerio = require('cheerio'), cheerioTableparser = require('cheerio-tableparser');

var app = express();
var port = process.env.port || 9080;
var router = express.Router();

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use('/', router);

async function digSimilarArtists(artist) {
    return promise = new Promise(function (resolve, reject) {
        var dataString = `seed=${artist}&x=148&y=23`;
        var headers = {
            'Origin': 'https://www.spotibot.com',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-US,en;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.86 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.spotibot.com/',
            'Connection': 'keep-alive',
            'Cookie': '__utmt=1; __utma=201630931.1761976938.1497543518.1497543518.1497543518.1; __utmb=201630931.1.10.1497543518; __utmc=201630931; __utmz=201630931.1497543518.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)'
        };
        var options = {
            url: 'https://www.spotibot.com/playlist-generator/index.php',
            method: 'POST',
            headers: headers,
            body: dataString
        };
        request(options).then(function (body) {
            resolve(body);
        }).catch(function (err) {
            reject(err);
        });
    });
}

async function returnArray(htmlBody) {
    var $ = cheerio.load(htmlBody);
    cheerioTableparser($);
    var data = $('#trackstable').parsetable(true, true, true);
    return data
}

async function parseArray(array) {
    let arr = new Array()
    arr = array;
    arr.splice(-1, 1);
    let titles = arr[0].slice(1);
    let artists = arr[1].slice(1);
    let length = arr[2].slice(1);
    let album = arr[3].slice(1);
    let albumFine = new Array();
    for (i=0;i<album.length-1;i++){
        let albumString = album[i] + "";
        albumString = albumString.replace('()','');
        albumFine.push(albumString);
    }
    let dictionary = titles.map((title, nIndex) => (
        artists.reduce((returner, artist, fIndex) => {
            if (nIndex === fIndex) {
                return returner = { title: title, artist: artist }
            }
            return returner;
        }, {})
    ))
    albumFine.map((album, index) => {
        dictionary[index].album = album;
    })
    return dictionary;
}

router.post('/suggest', function (req, res) {
    let artist = req.body.artist + "";
    digSimilarArtists(artist.replace(' ','+')).then(function (body) {
        returnArray(body).then(function (parsedBody) {
            parseArray(parsedBody).then(function (object) {
                res.json(object)
            });
        });
    });
});

app.listen(port);