/**
 * MongoDB Client
 */
import { MongoClient, ObjectId } from 'mongodb';

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

  /**
   * Inserts one document into a collection
   * @param {string} col The collection to insert into
   * @param {object} data The data of the new document
   */
  async insertOne(col, data) {
    const res = await this.db.collection(col).insertOne(data);
    return res;
  }

  /**
   * Returns first document that matches filter
   * @param {string} col The collection to search
   * @param {object} filter The values of the fields to match
   */
  async findOne(col, filter) {
    const nFilter = filter;

    if (Object.getOwnPropertyDescriptor(filter, '_id')) {
      nFilter._id = new ObjectId(filter._id);
    }

    const res = await this.db.collection(col).findOne(nFilter);
    return res;
  }
}

const dbClient = new DBClient();
export default dbClient;
