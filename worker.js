/**
 * Thumbnail generating Bull worker
 */
import { promises as fs } from 'fs';
import dbClient from './utils/db';

const Queue = require('bull');
const imageThumbnail = require('image-thumbnail');

const fileQueue = Queue('thumbnail generating');

fileQueue.process(async (job, done) => {
  if (!job.data.fileId) {
    throw new Error('Missing fileId');
  }

  if (!job.data.userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.findOne('files', { _id: job.data.fileId, userId: job.data.userId });
  if (!file) {
    done(new Error('File not found'));
    return;
  }

  const options = { responseType: 'base64' };
  const widths = [250, 500, 100];
  const promises = [];

  for (const w of widths) {
    options.width = w;
    promises.push(imageThumbnail(file.localPath, options).then((thumbnail) => {
      fs.writeFile(`${file.localPath}_${w}`, thumbnail, 'base64');
    }));
  }

  await Promise.all(promises);
  done();
});
