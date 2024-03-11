/**
 * Helper functions
 */
import redisClient from './redis';
import dbClient from './db';

/**
 * Returns a user given a token
 * @param {object} req The request object
 */
export async function getUserFromToken(req) {
  const token = req.get('X-Token');
  const userId = await redisClient.get(`auth_${token}`);
  const user = await dbClient.findOne('users', { _id: userId });

  return user;
}

/**
 * Changes the properties in a file object for a response
 * @param {object} file The file object
 * @returns {object} The formatted file object
 */
export function formatFileObject(file) {
  const res = file;

  res.id = res._id;
  delete res._id;
  delete res.localPath;

  return res;
}

/**
 * Validates the data for a new file
 * @param {object} nFileData The object containing the new file's data
 * @returns {sting} An error message if an error is encountered otherwise undefined.
 */
export async function validateFileData(nFileData) {
  let errMsg;

  if (!nFileData.name) {
    errMsg = 'Missing name';
  } else if (!nFileData.type) {
    errMsg = 'Missing type';
  } else if (!nFileData.data && nFileData.type !== 'folder') {
    errMsg = 'Missing data';
  }

  if (errMsg) return errMsg;

  if (nFileData.parentId !== '0') {
    const parent = await dbClient.findOne('files', { _id: nFileData.parentId });

    if (!parent) {
      errMsg = 'Parent not found';
    } if (parent.type !== 'folder') {
      errMsg = 'Parent is not a folder';
    }
  }

  return errMsg;
}
