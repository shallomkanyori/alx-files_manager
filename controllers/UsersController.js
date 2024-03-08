/**
 * Users controller
 */
import sha1 from 'sha1';
import dbClient from '../utils/db';

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
      const emailExists = await dbClient.findOne('users', { email: email });

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
}

export default UsersController;
