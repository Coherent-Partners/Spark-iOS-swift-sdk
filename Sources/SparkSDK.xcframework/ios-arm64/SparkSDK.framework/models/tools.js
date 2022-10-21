const fs = require("fs");
const location = "./coherent/ExecuteSDK/ModelMetaData.json";

const file = fs.readFileSync(location);

// generate base64
const data = file.toString("base64");
console.log(data);
fs.writeFile("./coherent/output.txt", data, (err) => {
  if (err) {
    console.log(err);
    return;
  }
});
// const buffer = Buffer.from(data, "base64");
// console.log("buffer", buffer);
// const uint = new Uint8Array(buffer);
// console.log(uint);
// fs.writeFileSync('./models/base64model.txt', data)

// generate blob
// const blob = atob(data)
// fs.writeFileSync('./models/blobmodel.txt', blob)
