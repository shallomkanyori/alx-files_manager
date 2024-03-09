/**
 * Files controller
 */
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import { getUserFromToken, formatFileObject, validateFileData } from '../utils/helpers';

export default class FilesController {
  /**
   * Creates a new file in DB and disk
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async postUpload(req, res) {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const nFileData = {
        name: req.body.name,
        type: req.body.type,
        parentId: req.body.parentId || 0,
        isPublic: req.body.isPublic || false,
        data: req.body.data,
      };

      const errMsg = await validateFileData(nFileData);

      if (errMsg) {
        res.status(400).json({ error: errMsg });
        return;
      }

      nFileData.userId = user._id;

      if (nFileData.type === 'folder') {
        delete nFileData.data;

        await dbClient.insertOne('files', nFileData);
        res.status(201).json(formatFileObject(nFileData));
        return;
      }

      // store data in local file with random name
      let path = process.env.FOLDER_PATH || '/tmp/files_manager';
      await fs.mkdir(path, { recursive: true });

      if (path[path.length - 1] === '/') path = path.slice(0, -1);
      const localPath = `${path}/${uuidv4()}`;

      await fs.writeFile(localPath, nFileData.data, 'base64');
      nFileData.localPath = localPath;

      delete nFileData.data;

      await dbClient.insertOne('files', nFileData);
      res.status(201).json(formatFileObject(nFileData));
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieves a file based on the id
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getShow(req, res) {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const fileId = req.params.id;
      const file = await dbClient.findOne('files', { _id: fileId });
      if (!file) {
        res.status(404).json({ error: 'Not found' });
      } else {
        res.json(formatFileObject(file));
      }
    } catch (err) {
      console.log(err.toString());
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieves all users files for a specific parentId with pagination
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getIndex(req, res) {
    try {
      const user = await getUserFromToken(req);
      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parentId = req.query.parentId || 0;
      const page = req.query.page || 0;
      const filesPerPage = 20;

      const fileCur = await dbClient.findPaginated('files', { parentId }, page * filesPerPage,
        filesPerPage);
      const files = [];

      await fileCur.forEach((doc) => {
        files.push(formatFileObject(doc));
      });

      res.json(files);
    } catch (err) {
      console.log(err.toString());
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
