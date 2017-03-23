var colors = require('colors/safe');
var crypto = require('crypto');
var fs = require('fs');

var Redis = require('ioredis');

var algorithm = 'sha256';

function filesize(filename) {
	return new Promise((done, fail) => {
		fs.stat(filename, (err, stat) => {
			if(err) {
				return fail(err);
			}
			return done(stat.size);
		})
	})
}

function hash(msg) {
	return crypto.createHash(algorithm).update(msg).digest('hex');
}

function checksum(filename) {
	return new Promise((done, fail) => {
		var sum = crypto.createHash(algorithm);
		var stream = fs.ReadStream(filename);
		stream.on('data', data => sum.update(data));
		stream.on('error', err => fail(err));
		stream.on('end', () => done(sum.digest('hex')));
	})
}

function mapToInfo(obj) {
	return Object.entries(obj).map(([key, val]) => `${key}=${val}`).join(' ');
}

function talk(...msgs) {
	console.log(...msgs);
}
talk.whisper = function whisper(...msgs) {
	console.log(colors.gray(...msgs));
}
talk.warn = function warn(...msgs) {
	console.warn(colors.yellow(...msgs));
}
talk.cry = function cry(...errs) {
	console.error(colors.red('ERROR!'));
	console.error(...errs);
}

class Storer {
	constructor(redis) {
		if(redis) {
			this.redis = redis;
		}
		else {
			this.redis = this.open();
		}
	}
	open() {
		return new Redis();
	}
	close() {
		this.redis.disconnect();
	}
}

module.exports = {
	hash,
	checksum,
	filesize,
	mapToInfo,
	talk,
	Storer,
};