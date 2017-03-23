var path = require('path');

var _ = require('lodash');

var {filesize, checksum, hash, talk, Storer} = require('../utils');

var magicStrings = {
	setOfFiles: 'files',
	idBySource: 'files:by-source',
	newFileEvent: 'new:file',
	delFileEvent: 'del:file',
}


class Files extends Storer {

	add(file) {
	}

	add(source) {
		return Files.sourceToFile(source)
		.then(file => {
			var id = Files.makeId(file.checksum, file.size);
			talk(`add ${file.source} as ${id}`);
			return Promise.all([
				this.redis.sadd(magicStrings.setOfFiles, id),
				this.redis.hmset(id, file),
				this.redis.hset(magicStrings.idBySource, file.source, id),
			]);
		})
	}

	addMany(sources) {
		return Promise.all(
			sources.map(source => this.add(source))
		)
	}

	remove(source) {
		return this.getIdFromSource(source)
		.then(id => {
			Promise.all([
				this.redis.srem(magicStrings.setOfFiles, id),
				this.redis.del(id),
				this.redis.hdel(magicStrings.idBySource, source),
			])
		})
		.then(() => source);
	}

	removeMany(sources) {
		return Promise.all(
			sources.map(source => this.remove(source))
		)
	}

	list() {
		return this.redis.smembers(magicStrings.setOfFiles);
	}

	getIdsFromSources(sources) {
		return this.redis.hmget(magicStrings.idBySource, sources);
	}

	getIdFromSource(source) {
		return new Promise((found, fail) => {
			this.redis.hget(magicStrings.idBySource, source)
			.then(id => id ? found(id) : fail(`${source} not in index`))
		});
	}

	listWithProps(props) {
		return this.list()
		.then(ids => {
			var propsFn = this.getProps.bind(this, props);
			return Promise.all(ids.map(propsFn))
			.then(propMaps => {
				return _.zipObject(ids, propMaps);
			})
		})
	}

	getProp(prop, id) {
		return this.redis.hget(id, prop);
	}

	getProps(props, id) {
		return this.redis.hmget(id, props)
		.then(res => {
			return _.zipObject(props, res);
		})
	}

	getAllProps(id) {
		return this.redis.hgetall(id)
	}

}

Files.sourceToFile = function(source) {
	var filepath = path.resolve(source);
	return Promise.all([
		checksum(filepath),
		filesize(filepath),
	])
	.then(([checksum, size]) => {
		return {
			checksum,
			size,
			source,
			filepath,
		};
	})
}
Files.makeId = function(checksum, filesize) {
	return Files.hashToId(hash(`${checksum}:${filesize}`))
}

Files.hashToId = function(hash) {
	return `file:${hash}`;
}

Files.idToRef = function(id) {
	return id.split(':')[1].substr(0, 6);
}

module.exports = {
	Files
};