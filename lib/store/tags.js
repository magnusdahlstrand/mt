var _ = require('lodash');

var {talk, Storer} = require('../utils');

var {Files} = require('./files');

var magicStrings = {
	setOfTags: 'tags',
}

function tagNameToId(name) {
	if(name.startsWith('tag:')) {
		return name;
	}
	return `tag:${name}`;
}
function idToTagsRef(id) {
	return `${id}:tags`;
}

class Tags extends Storer {
	tag(sources, tags) {
		return new Files(this.redis).getIdsFromSources(sources)
		.then(items => {
			var multi = this.redis.multi();
			// Add all tags to tags
			multi.sadd(magicStrings.setOfTags, tags);
			// Add all items to each tag:$name
			for(let tag of tags) {
				multi.sadd(tagNameToId(tag), items);
			}
			// Add all tags to $id:tags
			for(let item of items) {
				multi.sadd(idToTagsRef(item), tags);
			}
			return multi.exec();
		})
		.then(() => sources)
	}

	list() {
		return this.redis.smembers(magicStrings.setOfTags);
	}

	exists(tags) {
		var multi = this.redis.multi();
		for(let tag of tags) {
			multi.sismember(magicStrings.setOfTags, tag);
		}
		return multi.exec()
		.then(results => {
			return results.map(([, exists]) => !!exists)
		});
	}

	listWithCounts() {
		return this.list()
		.then(tags => {
			var multi = this.redis.multi();
			for(let tag of tags) {
				multi.scard(tagNameToId(tag));
			}
			return multi.exec()
			.then(results => results.map(result => result[1]))
			.then(counts => _.zipObject(tags, counts));
		})
	}

	getCount(tag) {
		return this.redis.scard(tagNameToId(tag));
	}

	itemsByTags(tags) {
		return this.redis.sinter(
			tags.map(tag => tagNameToId(tag))
		)
	}
}

module.exports = {
	Tags,
};