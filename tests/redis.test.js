/**
 * Tests for the redisClient
 */
/* eslint-disable global-require */
/* eslint-disable jest/no-hooks */
/* eslint-disable  jest/prefer-expect-assertions */
/* eslint-disable no-unused-expressions */
/* eslint-disable jest/valid-expect */
import * as redis from 'redis';
import { expect } from 'chai';
import * as sinon from 'sinon';
import { after, beforeEach } from 'mocha';

import redisClient from '../utils/redis';

let redisStore = {
  0: {},
};

const redisFake = {
  on: () => { },
  get: (key, cb) => cb(null, redisStore[this.db || 0][key]),
  setex: (key, duration, value, cb) => {
    redisStore[this.db || 0][key] = typeof value !== 'string' ? JSON.stringify(value) : value;

    setTimeout(() => {
      delete redisStore[this.db || 0][key];
    }, duration * 1000);

    cb(null, true);
  },
  del: (key, cb) => {
    if (Object.hasOwnPropertyDescriptor(redisStore[this.db || 0], key)) {
      delete redisStore[this.db || 0][key];
      return cb(null, 1);
    }
    return cb(null, 0);
  },
};

const getSpy = sinon.spy(redisFake, 'get');
const setexSpy = sinon.spy(redisFake, 'setex');
const delSpy = sinon.spy(redisFake, 'del');
const redisStub = sinon.stub(redis, 'createClient').callsFake(() => redisFake);

describe('redisClient', () => {
  after(() => {
    redisStub.restore();
  });

  beforeEach(() => {
    redisStore = {
      0: {},
    };
  });

  describe('get', () => {
    it('calls the redis get function', () => new Promise((done) => {
      redisClient.get('key').then(() => {
        expect(getSpy.calledOnceWithExactly('key')).to.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns null if the key has not been stored', () => new Promise((done) => {
      redisClient.get('key').then((val) => {
        expect(val).to.be.null;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns the value of the stored key', () => new Promise((done) => {
      redisStore[0].key = 'val';
      redisClient.get('key').then((val) => {
        expect(val).to.be.equal('val');
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('set', () => {
    it('calls the redis setex function', () => new Promise((done) => {
      redisClient.set('key', 20, 'val').then(() => {
        expect(setexSpy.calledOnceWithExactly('key', 20, 'val')).to.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('sets the value in redis', () => new Promise((done) => {
      redisClient.set('key', 20, 'val').then(() => {
        expect(redisStore[0].key).to.equal('val');
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('sets the value in redis as a string', () => new Promise((done) => {
      redisClient.set('key', 1000, 4).then(() => {
        expect(redisStore[0].key).to.equal('4');
        expect(typeof redisStore[0].key).to.equal('string');
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('deletes a set value after the set duration (secs) has passed', () => new Promise((done) => {
      redisClient.set('key', 5, 'val').then(() => {
        setTimeout(() => {
          expect(redisStore[0].key).to.be.null;
          done();
        }, 6000);
      }).catch((err) => {
        done(err);
      });
    }));
  });

  describe('del', () => {
    it('calls the redis del function', () => new Promise((done) => {
      redisClient.del('key').then(() => {
        expect(delSpy.calledOnceWithExactly('key')).to.be.true;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('deletes a key in the store and returns 1', () => new Promise((done) => {
      redisStore[0].key = 'val';
      redisClient.del('key').then((res) => {
        expect(res).to.be.equal(1);
        expect(redisStore[0].key).to.be.null;
        done();
      }).catch((err) => {
        done(err);
      });
    }));

    it('returns 0 if key is not stored in redis', () => new Promise((done) => {
      redisClient.del('key').then((res) => {
        expect(res).to.be.equal(0);
        done();
      }).catch((err) => {
        done(err);
      });
    }));
  });
});
