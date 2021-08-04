const download = require("download");
const sanitize = require("sanitize-filename");
const fetch = require("node-fetch");
const fs = require("fs");
const { join } = require("path");

const links = [
  "https://www.artstation.com/artwork/9mxKNq",
  "https://www.artstation.com/artwork/68VdxN",
  "https://www.artstation.com/artwork/Ga5P03",
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    fetch(url).then(async (r) => {
      if (r.ok) {
        resolve(await r.json());
      } else {
        reject(r.statusText);
      }
    });
  });
}

function processArtwork(link) {
  return new Promise(async (resolve, reject) => {
    const id = link.split("/").pop();
    const jsonUrl = `https://www.artstation.com/projects/${id}.json`;
    const data = await fetchJSON(jsonUrl).catch((e) =>
      reject(`Failed to fetch artwork json: ${e}`)
    );
    console.log(`Processing ${data.title}...`);
    const folderName = sanitize(data.title);
    const folderPath = join(__dirname, "art", folderName);

    if (!fs.existsSync(folderPath)) {
      // make folder
      fs.mkdirSync(folderPath, { recursive: true });
    }

    for await (const asset of data.assets) {
      await download(asset.image_url.split("?").shift(), folderPath)
        .then(() => {
          console.log(
            `[${data.title}]: Asset (${asset.position + 1}/${
              data.assets.length
            }) downloaded.`
          );
        })
        .catch((e) => {
          console.log(
            `[${data.title}]: Asset (${asset.position + 1}/${
              data.assets.length
            }) failed to download!`,
            e
          );
        });
    }

    const descriptionFilePath = join(folderPath, "description.txt");
    fs.writeFileSync(descriptionFilePath, data.description);
    resolve();
  });
}

(async () => {
  for (const link of links) {
    await processArtwork(link);
  }
})();
