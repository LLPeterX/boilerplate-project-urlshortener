require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const mongoose = require('mongoose');

const urlFileName = `${process.cwd()}/.url`;
const port = process.env.PORT || 3000;

// log all requests - for debugging
//app.use((req, res, next) => {
//  console.log(`${req.method} ${req.path}, body = ${req.body}`); // req.body undefined!
//  next();
//});

// main code
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.urlencoded({ extended: false }));

// disable access to file .env
app.get("/.env", function (req, res) {
  res.send(403, 'Access denied');
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

// define  a schema for URL shortener
const schema = new mongoose.Schema({
  long_url: { type: String, required: true },
  short_url: { type: String, required: true, unique: true },
});
const model = mongoose.model('ShortUrl', schema);

// создание нового шорта или вернуть уже существующий, если есть
app.post('/api/shorturl', function (req, res) {
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
          res.json({ original_url: longUrl, short_url: newUrl.short_url });
        });
      } else {
        res.json({ original_url: data.long_url, short_url: data.short_url });
      }
    }); // model.findOne()
  }); // dns.resole()
}); // app.post()


app.get("/api/shorturl/:url", function (req, res) {
  let url = req.params.url;
  if (!url || url.length != 6) {
    res.json({ error: 'invalid URL' });
  } else {
    // найти в БД url по short_url
    model.findOne({ short_url: url }, function (err, data) {
      if (err) {
        res.json({ error: 'invalid URL' });
      } else {
        res.redirect(data.long_url);
      }
    }); // findOne()
  } // if url OK
}); // app.get()

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
