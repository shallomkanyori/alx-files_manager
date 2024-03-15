/**
 * MongoDB Client
 */
import { MongoClient, ObjectId } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    const defaultDb = process.env.DB_ENV === 'test' ? 'files_manager_test' : 'files_manager';
    this.database = process.env.DB_DATABASE || defaultDb;

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
    const nData = data;

    if (typeof data.userId === 'string') {
      nData.userId = new ObjectId(data.userId);
    }

    if (typeof data.parentId === 'string' && data.parentId !== '0') {
      nData.parentId = new ObjectId(data.parentId);
    }

    const res = await this.db.collection(col).insertOne(nData);
    return res;
  }

  /**
   * Returns first document that matches filter
   * @param {string} col The collection to search
   * @param {object} filter The values of the fields to match
   */
  async findOne(col, filter) {
    const nFilter = filter;

    if (typeof filter._id === 'string') {
      nFilter._id = new ObjectId(filter._id);
    }

    if (typeof filter.userId === 'string') {
      nFilter.userId = new ObjectId(filter.userId);
    }

    const res = await this.db.collection(col).findOne(nFilter);
    return res;
  }

  /**
   * Returns all documents that matches filter paginated
   * @param {string} col The collection to search
   * @param {object} filter The values of the fields to match
   * @param {number} skip The number of ducuments to skip
   * @param {number} limit The number of documents in each page
   */
  async findPaginated(col, filter, skip, limit) {
    const nFilter = filter;

    if (typeof filter._id === 'string') {
      nFilter._id = new ObjectId(filter._id);
    }

    if (typeof filter.userId === 'string') {
      nFilter.userId = new ObjectId(filter.userId);
    }

    if (typeof filter.parentId === 'string' && filter.parentId !== '0') {
      nFilter.parentId = new ObjectId(filter.parentId);
    }

    const res = await this.db.collection(col).aggregate([{ $match: nFilter },
      { $sort: { _id: -1 } },
      { $skip: skip },
      { $limit: limit }]);
    return res;
  }

  /**
   * Update a single document
   * @param {string} col The collection of the document to update
   * @param {object} filter The criteria to match for the document to update
   * @param {object} update The update document
   */
  async updateOne(col, filter, update) {
    const nFilter = filter;

    if (Object.getOwnPropertyDescriptor(filter, '_id') && typeof filter._id === 'string') {
      nFilter._id = new ObjectId(filter._id);
    }

    if (Object.getOwnPropertyDescriptor(filter, 'userId') && typeof filter.userId === 'string') {
      nFilter.userId = new ObjectId(filter.userId);
    }

    const res = await this.db.collection(col).findOneAndUpdate(filter, update,
      { returnDocument: 'after' });
    return res.value;
  }
}

const dbClient = new DBClient();
export default dbClient;
