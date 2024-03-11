/**
 * Tests for the dbClient
 */
/* eslint-disable global-require */
/* eslint-disable jest/no-hooks */
/* eslint-disable  jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import * as mongodb from 'mongodb';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { after, beforeEach } from 'mocha';

import dbClient from '../utils/db';

const dbStore = {};

const collectionFake = {
  documents: [],
  countDocuments: () => Promise.resolve(this.documents.length),
  insertOne: (data) => {
    const d = data;
    d._id = new mongodb.ObjectId();
    this.documents.push(d);

    const res = { insertedId: d._id };
    return Promise.resolve(res);
  },
  find: (filter, count = undefined) => {
    const res = [];

    for (const doc of this.documents) {
      let matches = true;

      for (const f of filter) {
        if (doc[f] !== filter[f]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        res.push(doc);
      }
    }

    if (!count) {
      return res;
    }

    if (count === 1) {
      return res[0];
    }

    return res.slice(0, count);
  },
  findOne: (filter) => Promise.resolve(this.find(filter, 1)),
  findOneAndUpdate: (filter, update) => {
    const doc = this.find(filter, 1);

    if (!doc) {
      return doc;
    }

    for (const u of update.$set) {
      doc[u] = update.$set[u];
    }

    return Promise.resolve(doc);
  },
  aggregate: (pipeline) => {
    const pipe = {};
    for (const p of pipeline) {
      for (const o of p) {
        pipe[o] = p[o];
      }
    }

    const res = this.find(pipe.$match);
    const skip = pipe.$skip || 0;
    const limit = pipe.$limit || 20;

    return Promise.resolve(res.slice(skip, skip + limit));
  },
};

const dbFake = {
  connect: () => Promise.resolve(),
  db: (database) => {
    this.db = database;
    dbStore[this.db] = dbStore[this.db] || {};
    return dbStore[this.db];
  },
  collection: (col) => {
    if (!dbStore[this.db][col]) {
      dbStore[this.db][col] = collectionFake;
    }
    return dbStore[this.db][col];
  },
};

const countSpy = sinon.spy(collectionFake, 'countDocuments');
const insertSpy = sinon.spy(collectionFake, 'insertOne');
const findSpy = sinon.spy(collectionFake, 'findOne');
const aggrSpy = sinon.spy(collectionFake, 'aggregate');
const findUpdateSpy = sinon.spy(collectionFake, 'findOneAndUpdate');

const dbStub = sinon.stub(mongodb, 'MongoClient').callsFake(() => dbFake);

describe('dbClient', () => {
  after(() => {
    dbStub.restore();
  });

  beforeEach(() => {
    dbStore.files_manager = {};
  });

  describe('nbUsers', () => {
    it('calls MongoDB countDocuments', () => new Promise((done) => {
      dbClient.nbFiles().then(() => {
        expect(countSpy.calledOnce).to.be.true;
        countSpy.resetHistory();
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns 0 if no users', () => new Promise((done) => {
      dbClient.nbUsers().then((count) => {
        expect(count).to.equal(0);
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns the number of users', () => new Promise((done) => {
      dbStore.files_manager.users = collectionFake;
      dbStore.files_manager.users.documents = [{ email: 'test@test.com' }, { email: 'josh@smith.com' }];

      dbClient.nbUsers().then((count) => {
        expect(count).to.equal(2);
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('nbFiles', () => {
    it('calls MongoDB countDocuments', () => new Promise((done) => {
      dbClient.nbFiles().then(() => {
        expect(countSpy.calledOnce).to.be.true;
        countSpy.resetHistory();
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns 0 if no files', () => new Promise((done) => {
      dbClient.nbFiles().then((count) => {
        expect(count).to.equal(0);
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns the number of files', () => new Promise((done) => {
      dbStore.files_manager.files = collectionFake;
      dbStore.files_manager.files.documents = [{ name: 'a.txt' }, { name: 'b.png' }];

      dbClient.nbFiles().then((count) => {
        expect(count).to.equal(2);
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('insertOne', () => {
    it('calls MongoDB insertOne', () => new Promise((done) => {
      dbClient.insertOne('files', { name: 'a.txt' }).then(() => {
        expect(insertSpy.calledOnceWithExactly({ name: 'a.txt' })).to.be.true;
      }).catch((err) => {
        done(err);
      });
    }));

    it('inserts a document into a collection', () => new Promise((done) => {
      dbClient.insertOne('users', { email: 'test@test.com' }).then((res) => {
        expect(dbStore.files_manager.users.documents[0]._id).to.equal(res.insertedId);
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('findOne', () => {
    it('calls MongoDB findOne', () => new Promise((done) => {
      dbClient.findOne('users', { _id: '1' }).then(() => {
        expect(findSpy.calledOnceWithExactly({ _id: '1' })).to.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('searces for a document and returns it', () => new Promise((done) => {
      dbStore.files_manager.files = collectionFake;
      dbStore.files_manager.files.documents = [{ _id: '1', name: 'a.txt' },
        { _id: '2', name: 'b.png' }];

      dbClient.findOne({ name: 'a.txt' }).then((res) => {
        expect(res._id).to.equal('1');
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns null if document not found', () => new Promise((done) => {
      dbStore.files_manager.users = collectionFake;
      dbStore.files_manager.users.documents = [{ _id: '1', email: 'test@test.com' },
        { _id: '2', name: 'user@mail.com' }];

      dbClient.findOne({ email: 'john@smith.com' }).then((res) => {
        expect(res).to.be.null;
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('updateOne', () => {
    it('calls MongoDB findOneAndUpdate', () => new Promise((done) => {
      const update = { $set: { name: 'a' } };
      dbClient.updateOne('files', { _id: '1' }, update).then(() => {
        expect(findUpdateSpy.calledOnceWithExactly({ _id: '1' }, update,
          { returnDocument: 'after' })).to.be.true;
      }).catch((err) => {
        done(err);
      });
    }));

    it('updates a document and returns the updated version', () => new Promise((done) => {
      dbStore.files_manager.files = collectionFake;
      dbStore.files_manager.files.documents = [{ _id: '1', name: 'a.txt' },
        { _id: '2', name: 'b.png' }];

      dbClient.updateOne('files', { _id: '1' },
        { $set: { name: 'b.txt' } }).then((res) => {
        expect(res._id).to.equal('1');
        expect(res.name).to.equal('b.txt');
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns null if document not found', () => new Promise((done) => {
      dbStore.files_manager.users = collectionFake;
      dbStore.files_manager.users.documents = [{
        _id: '1',
        email: 'test@test.com',
        password: '89cad29e',
      }];

      dbClient.updateOne('users', { email: 'john@smith.com' },
        { $set: { password: '70854f25fa' } }).then((res) => {
        expect(res).to.be.null;
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('findPaginated', () => {
    it('calls MongoDb aggregate', () => new Promise((done) => {
      dbClient.findPaginated('users', {}, 0, 1).then(() => {
        const exp = [{ $match: {} }, { $skip: 0 }, { $limit: 1 }];
        expect(aggrSpy.calledOnceWithExactly(exp)).to.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns paginated filtered documents', () => new Promise((done) => {
      dbStore.files_manager.users = collectionFake;
      dbStore.files_manager.users.documents = [{ _id: '1' }, { _id: '2' }, { _id: '3' },
        { _id: '4' }];

      dbClient.findPaginated('users', {}, 2, 2).then((res) => {
        expect(res.length).to.equal(2);
        expect(res[0]._id).to.equal('3');
        expect(res[1]._id).to.equal('4');
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });
});
