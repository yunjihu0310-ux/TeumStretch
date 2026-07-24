const fs = require("fs");
const path = require("path");

const root = __dirname;
const output = path.join(root, "dist");
const files = ["index.html", "styles.css", "app.js", "sw.js", "icon.svg", "manifest.webmanifest", ".nojekyll"];

fs.rmSync(output, { recursive:true, force:true });
fs.mkdirSync(output, { recursive:true });
files.forEach(file => fs.copyFileSync(path.join(root, file), path.join(output, file)));
console.log(`Static site ready: ${files.length} files in dist`);
