const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const { assetConfig } = require('../config/asset.config');
const { relativePath, thumb } = assetConfig;

export default async (req, res, next) => {
  const drive = req.query && req.query.drive;
  const directoryPath = path.join(__dirname, `${relativePath}/${drive}/`);

  if (!drive || !fs.existsSync(directoryPath)) {
    res.status(404).send('Drive is not found');
  }

  const thumbDir = thumb.dir;
  const thumbDirPath = path.join(__dirname, `${relativePath}/${thumbDir}`);
  const images = [];
  let files = [];
  let done = 0;

  if (!fs.existsSync(thumbDirPath)) {
    fs.mkdirSync(thumbDirPath);
  }

  try {
    files = await readdir(directoryPath);
  } catch (e) { }

  const count = files.length;
  if (count === 0) return res.send(files);

  files.forEach(async (name) => {
    const fullPath = path.join(directoryPath, name);
    const stats = await stat(fullPath);
    const isDir = stats.isDirectory();

    if (isDir) {
      return ++done && done === count && res.send(images);
    }

    const { size, mtime, dev, ino } = stats;
    const url = `/${drive}/${name}`;
    const thumbName = `${dev + ino}${thumb.format}`;
    const thumbUrl = `/${thumbDir}/${thumbName}`;
    const fullThumbUrl = path.resolve(__dirname, `${relativePath}/${thumbDir}/${thumbName}`);
    const isThumbExist = !!(await fs.promises.stat(fullThumbUrl).catch(e => false));
    let dimensions;

    try {
      dimensions = isThumbExist
        ? await sharp(fullThumbUrl).metadata()
        : await sharp(fullPath)
          .resize(thumb.width)
          .webp()
          .toFile(fullThumbUrl);
    }
    catch (e) { }

    if (dimensions) {
      const { width, height } = dimensions;
      const imgObj = {
        url,
        width,
        height,
        name,
        thumbUrl,
        size,
        mtime
      }

      images.push(imgObj);
    }

    return ++done && done === count && res.send(images);
  });
}
