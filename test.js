const dns = require('dns');

function checkURL(url) {
  try {
    let urlObj = new URL(url);
    console.log(urlObj.host);
    dns.resolve(urlObj.host, function (err, address) {
      if (err) {
        throw new Error('INVALID URL');
      }
      console.log('Resolved address: ', address);
    });
    //dns.resolve(urlObj.host)
  } catch (e) {
    return null;
  }

}

checkURL("http://www.example.com/?foo=bar"); // '93.184.216.34'
checkURL("http://localhost"); // 127.0.0.1
checkURL("foo"); // null

