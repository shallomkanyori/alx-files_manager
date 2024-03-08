/**
 * Files controller
 */
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export default class FilesController {
  /**
   * Creates a new file in DB and disk
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async postUpload(req, res) {
    try {
      const token = req.get('X-token');
      const userId = await redisClient.get(`auth_${token}`);
      const user = await dbClient.findOne('users', { _id: userId });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { name } = req.body;
      const { type } = req.body;
      const parentId = req.body.parentId || 0;
      const isPublic = req.body.isPublic || false;
      const { data } = req.body;

      let errMsg;

      if (!name) {
        errMsg = 'Missing name';
      } else if (!type) {
        errMsg = 'Missing type';
      } else if (!data && type !== 'folder') {
        errMsg = 'Missing data';
      }

      if (errMsg) {
        res.status(400).json({ error: errMsg });
        return;
      }

      if (parentId) {
        const parent = await dbClient.findOne('files', { _id: parentId });

        if (!parent) {
          errMsg = 'Parent not found';
        } if (parent.type !== 'folder') {
          errMsg = 'Parent is not a folder';
        }

        if (errMsg) {
          res.status(400).json({ error: errMsg });
          return;
        }
      }

      const nFile = {
        name,
        type,
        parentId,
        isPublic,
        userId: user._id,
      };

      if (type === 'folder') {
        const result = await dbClient.insertOne('files', nFile);
        nFile.id = result.insertedId;

        res.status(201).json(nFile);
        return;
      }

      const path = process.env.FOLDER_PATH || '/tmp/files_manager';
      await fs.mkdir(path, { recursive: true });
      const randFileName = uuidv4();
      const localPath = `${path}/${randFileName}`;

      await fs.writeFile(localPath, data, 'base64');
      nFile.localPath = localPath;

      const result = await dbClient.insertOne('files', nFile);

      nFile.id = result.insertedId;
      delete nFile.localPath;

      res.status(201).json(nFile);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
