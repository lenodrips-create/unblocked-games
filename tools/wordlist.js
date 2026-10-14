// Edit the name filter's word lists, which namefilter.js keeps encoded.
//   node tools/wordlist.js decode   -> writes tools/wordlist.local.json (git-ignored)
//   (edit that file)
//   node tools/wordlist.js encode   -> writes it back into namefilter.js
// Don't commit wordlist.local.json: everything in this repo is published.
const fs = require("fs");
const path = require("path");
const FILTER = path.join(__dirname, "..", "namefilter.js");
const LOCAL = path.join(__dirname, "wordlist.local.json");
const KEY = "edudeck";
const BLOB = /(\}\)\(\n)([\s\S]*?)(\n  \);)/;

function xor(buf) {
  for (let i = 0; i < buf.length; i++) buf[i] ^= KEY.charCodeAt(i % KEY.length);
  return buf;
}

const src = fs.readFileSync(FILTER, "utf8");
const m = src.match(BLOB);
if (!m) throw new Error("couldn't find the encoded list in namefilter.js");

if (process.argv[2] === "decode") {
  const b64 = m[2].replace(/[\s"+]/g, "");
  const words = JSON.parse(xor(Buffer.from(b64, "base64")).toString("utf8"));
  fs.writeFileSync(LOCAL, JSON.stringify(words, null, 2) + "\n");
  console.log("wrote " + LOCAL);
} else if (process.argv[2] === "encode") {
  const words = JSON.parse(fs.readFileSync(LOCAL, "utf8"));
  const b64 = xor(Buffer.from(JSON.stringify(words), "utf8")).toString("base64");
  const lines = b64.match(/.{1,120}/g).map((s) => '    "' + s + '"').join(" +\n");
  fs.writeFileSync(FILTER, src.replace(BLOB, (_, a, __, c) => a + lines + c));
  console.log("updated namefilter.js (bump its ?v= in index.html and home.html)");
} else {
  console.log("usage: node tools/wordlist.js decode|encode");
}
