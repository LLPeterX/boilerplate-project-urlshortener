require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

const urlFileName = `${process.cwd()}/.url`;
const port = process.env.PORT || 3000;

app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: false }));

app.get("/.url", function (req, res) {
  res.send(404, 'Not Found');
});

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

// connect to mongodb
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .catch(err => {
    console.error('Cannot connect to mongoDB', err);
  });
//const db = mongoose.connection;
// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', function () {
//   // we're connected!
// });

// define  a schema for URL shortener
const schema = new mongoose.Schema({
  long_url: { type: String, required: true },
  short_url: { type: String, required: true, unique: true },
});
const model = mongoose.model('ShortUrl', schema);

// 
app.post('/api/shorturl/new', function (req, res) {
  let longUrl = req.body.url;
  if (!longUrl || longUrl.length < 2) {
    return res.json({ error: 'invalid URL' });
  }
  // check URL via dns lookup
  if (!/^https?/.test(longUrl)) {
    longUrl = "http://" + longUrl;
  }
  let urlObj = new URL(longUrl);
  dns.resolve(urlObj.host, function (err, address) {
    if (err) {
      return res.json({ error: 'invalid URL' });
    }
    // try find existing long url
    model.findOne({ long_url: longUrl }, function (err, data) {
      if (err) {
        return console.log('findOne error:', err);
      }
      if (data === null) {
        // create a short URL and return
        const newUrl = model({ long_url: longUrl, short_url: "" }); // now we got generated field "_id"
        newUrl.short_url = newUrl._id.toString().slice(-6);
        newUrl.save(function (err) {
          console.log("the new URL is added");
          res.json({ original_url: longUrl, short_url: newUrl.short_url });
        });
      } else {
        res.json({ original_url: data.long_url, short_url: data.short_url });
      }
    }); // model.findOne()
  }); // dns.resole()
}); // app.post()

// generate short url for POST
// app.post("/api/shorturl/new", function (req, res) {
//   // значение URL берем из запроса - req.body.url, проверяем через dns
//   try {
//     let inputURL = req.body.url;
//     console.log('req body=',req.body);
//     // случай, если указан "example.com", а не "http://example.com"
//     // для http и https - разные короткие URL.
//     // если не указать http://, то URL() выдаст ошибку
//     if (!/^https?/.test(inputURL)) {
//       inputURL = "http://" + inputURL;
//     }
//     let urlObj = new URL(inputURL);
//     dns.resolve(urlObj.host, function (err, address) {
//       if (err) {
//         console.log('resolve error:',err);
//         res.json({ error: 'invalid url' });
//       } else {
//         // получаем ранее сохраненные данные и добавляем новые
//         let urls = readUrls(); // при первом запросе будет null, т.к. файла еще нет
//         if (!urls) {
//           urls = {};
//         }
//         let shortURL = Object.values(urls).length ? Math.max(...Object.values(urls)) + 1 : 1;
//         urls[inputURL] = shortURL;
//         saveUrls(urls);
//         let ret = { original_url: inputURL, short_url: shortURL };
//         console.log('sending:',ret);
//         res.json(ret);
//       }
//     });
//   } catch (e) {
//     console.error('post error', e);
//     res.json({ error: 'invalid url' });
//   }
// });

// сделать редирект по короткому пути
// app.get("/api/shorturl/:url", function (req, res) {
//   let url = req.params.url;
//   console.log('found url', url);
//   if (!url) {
//     return res.json({ error: 'invalid url' });
//   }
//   try {
//     let urls = readUrls();
//     // находим в объекте имя свойства, значение которого = url
//     let u = Object.entries(urls).find(e => e[1] == url);
//     console.log('found ', u);
//     if (!u) {
//       throw new Error('INVALID URL');
//     }
//     console.log('redirect to', u);
//     res.redirect(u[0]);
//   } catch (e) {
//     console.error(e);
//     res.json({ error: 'invalid url' });
//   }
// });

app.get("/api/shorturl/:url", function (req, res) {
  let url = req.params.url;
  if (!url || url.length != 6) {
    console.log('get error with url', url);
    res.json({ error: 'invalid URL' });
  } else {
    // найти в БД url по short_url
    model.findOne({ short_url: url }, function (err, data) {
      if (err) {
        res.json({ error: 'invalid URL' });
      } else {
        console.log('return data:', data);
        //res.json({ original_url: data.long_url, short_url: data.short_url });
        res.redirect(data.long_url);
      }
    }); // findOne()
  } // if url OK
}); // app.get()

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
