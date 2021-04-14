require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const dns = require('dns');
const urlFileName = __dirname + "/.url";
// body-parser now is not requied
//const bodyParser = require('body-parser');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: false }));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// Реализацтя POST на /api/shorturl/new
// не будем заморачиваться с СУБД, а используем файл .url в формате JSON
// {original_url, short_url}
function readUrls() {
  try {
    return JSON.parse(fs.readFileSync(urlFileName));
  } catch (e) {
    return null;
  }
}

function saveUrls(obj) {
  console.log(`saving to ${urlFileName}`, obj);
  fs.writeFileSync(urlFileName, JSON.stringify(obj));
}

// generate short url for POST
app.post("/api/shorturl/new", function (req, res) {
  // значение URL берем из запроса - req.body.url, проверяем через dns
  try {
    let inputURL = req.body.url;
    console.log(req.body);
    // случай, если указан "example.com", а не "http://example.com"
    // для http и https - разные короткие URL.
    if (!/^https?/.test(inputURL)) {
      inputURL = "http://" + inputURL;
    }
    let urlObj = new URL(inputURL);
    dns.resolve(urlObj.host, function (err, address) {
      if (err) {
        res.json({ error: 'invalid url' });
      }
      // получаем сохраненные данные
      let urls = readUrls(); // при первом запросе будет null, т.к. файла еще нет
      if (!urls) {
        urls = {};
      }
      let shortURL = Object.values(urls).length ? Math.max(...Object.values(urls)) + 1 : 1;
      urls[inputURL] = shortURL;
      saveUrls(urls);
      res.json({ original_url: inputURL, short_url: shortURL });
    });
  } catch (e) {
    console.error('post error', e);
    res.json({ error: 'invalid url' });
  }
});

// сделать редирект по короткому пути
app.get("/api/shorturl/:url", function (req, res) {
  let url = req.params.url;
  console.log('found url', url);
  if (!url) {
    res.json({ error: 'invalid url' });
  }
  try {
    let urls = readUrls();
    // находим в объекте имя свойства, значение которого = url
    let u = Object.entries(urls).find(e => e[1] == url);
    console.log('found ',u);
    if (!u) {
      throw new Error();
    }
    console.log('redirect to', u);
    res.redirect(u[0]);
  } catch (e) {
    console.error(e);
    res.json({ error: 'invalid url' });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
