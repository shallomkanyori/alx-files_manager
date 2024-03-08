/**
 * Redis Client
 */
import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.connected = true;

    this.client = createClient().on('error', (err) => {
      this.connected = false;
      console.log(err.toString());
    }).on('connect', () => {
      this.connected = true;
    });
  }

  /**
   * Checks connection to Redis
   * @returns {boolean} True if the connection is successful. Otherwise false.
   */
  isAlive() {
    return this.connected;
  }

  /**
   * Returns the Redis value for the given key
   * @param {string} key The key whose value to return
   * @returns {*} The value stored for the key
   */
  async get(key) {
    this.client.get = promisify(this.client.get);

    const val = await this.client.get(key);
    return val;
  }

  /**
   * Sets a key and value in Redis with an expiration
   * @param {string} key The key to set
   * @param {*} val The value to set
   * @param {number} duration The seconds to expiration
   */
  async set(key, val, duration) {
    this.client.setex = promisify(this.client.setex);
    await this.client.setex(key, duration, val);
  }

  /**
   * Removes a key/value from Redis
   * @param {string} key The key to remove
   */
  async del(key) {
    this.client.del = promisify(this.client.del);
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
