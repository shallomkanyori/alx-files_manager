/**
 * App API endpoints
 */
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  /**
   * Returns the status of the API
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static getStatus(req, res) {
    const redisStatus = redisClient.isAlive();
    const dbStatus = dbClient.isAlive();

    res.status(200).json({ redis: redisStatus, db: dbStatus });
  }

  /**
   * Returns the documents stats from the dbClient
   * @param {object} req The request object
   * @param {object} res The response object
   */
  static async getStats(req, res) {
    const nUsers = await dbClient.nbUsers();
    const nFiles = await dbClient.nbFiles();

    res.status(200).json({ users: nUsers, files: nFiles });
  }
}

export default AppController;
