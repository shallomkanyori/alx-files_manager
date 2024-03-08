/**
 * Users controller
 */
import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  /**
   * Creates a new user in DB
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async postNew(req, res) {
    const { email } = req.body;
    const { password } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).json({ error: 'Missing password' });
      return;
    }

    try {
      const emailExists = await dbClient.findOne('users', { email });

      if (emailExists) {
        res.status(400).json({ error: 'Already exist' });
        return;
      }

      const result = await dbClient.insertOne('users', { email, password: sha1(password) });
      res.status(201).json({ email, id: result.insertedId });
    } catch (error) {
      console.log(error.toString());
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Retrieves a user based on the token
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getMe(req, res) {
    try {
      const token = req.get('X-Token');
      const userId = await redisClient.get(`auth_${token}`);
      const user = await dbClient.findOne('users', { _id: userId });

      if (!user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      res.json({ email: user.email, id: user._id.toString() });
    } catch (err) {
      console.log(err.toString());
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
