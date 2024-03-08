/**
 * Authentication controller
 */
import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

export default class AuthController {
  /**
   * Signs in a user by generating a new authentication token
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getConnect(req, res) {
    let credsStr;

    try {
      const b64Auth = req.get('Authorization').substring(6);
      credsStr = Buffer.from(b64Auth, 'base64').toString('utf8');
    } catch (err) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const creds = credsStr.split(':');
      const email = creds[0];
      const password = creds[1];

      const user = await dbClient.findOne('users', { email });
      if (!user || user.password !== sha1(password)) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const token = uuidv4();

      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

      res.status(200).json({ token });
    } catch (err) {
      console.log(err.toString());
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Signs out a user based on the token
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getDisconnect(req, res) {
    try {
      const token = req.get('X-Token');
      const key = `auth_${token}`;

      const userId = await redisClient.get(key);
      if (!userId) {
        res.send(401).json({ error: 'Unauthorized' });
        return;
      }

      await redisClient.del(key);
      res.status(204).end();
    } catch (err) {
      console.log(err.toString());
      res.send(500).json({ error: 'Internal server error' });
    }
  }
}
