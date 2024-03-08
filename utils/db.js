/**
 * MongoDB Client
 */
import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';

    this.connected = false;

    const url = `mongodb://${this.host}:${this.port}`;

    this.client = MongoClient(url, { useUnifiedTopology: true });

    this.client.connect().then(() => {
      this.db = this.client.db(this.database);
      this.connected = true;
    }).catch((err) => {
      this.connected = false;
      console.log(err.toString());
    });
  }

  /**
   * Checks connection to MongoDB
   * @returns {boolean} True if the connection is successful. Otherwise false.
   */
  isAlive() {
    return this.connected;
  }

  /**
   * Returns the number of documents in the collection users
   * @returns {number}
   */
  async nbUsers() {
    try {
      const res = await this.db.collection('users').countDocuments();
      return res;
    } catch (err) {
      console.log(err.toString());
      return 0;
    }
  }

  /**
   * Returns the number of documents in the collection files
   * @returns {number}
   */
  async nbFiles() {
    try {
      const res = await this.db.collection('files').countDocuments();
      return res;
    } catch (err) {
      console.log(err.toString());
      return 0;
    }
  }
}

const dbClient = new DBClient();
export default dbClient;
