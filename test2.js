const crypto = require('crypto');


function createShortURL(longURL) {
  if (!longURL || longURL.length === 0) {
    console.log('error');
    return null;
  }
  return crypto.createHash('sha1').update(longURL).digest('hex');
}

//console.log(createShortURL('http://www.example.com'));
const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const BASE = ALPHABET.length;

function encode(num) {
  let sb = [];
  while (num > 0) {
    sb.push(ALPHABET[num % BASE]);
    num /= BASE;
  }
  return sb.reverse().join();
}

function decode(str) {
  let num = 0;
  for (let i = 0; i < str.length; i++) {
    num = num * BASE + ALPHABET.indexOf(str[i]);
  }
  return num;
}

console.log(encode(1));
