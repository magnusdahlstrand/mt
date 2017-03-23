var Redis = require('ioredis');
var _ = require('lodash');

var {hash, talk, cry} = require('../utils');

var allowedPropValTypes = new Set([
	typeof "",
	typeof 1,
	typeof false,
]);

var magicStrings = {
	setOfJobs: 'jobs',
	newJobEvent: 'new:job',
	delJobEvent: 'del:job',
}
function jobHashToId(hash) {
	return `job:${hash}`;
}

function Jobs() {
	this.redis = new Redis();
}

// Job ID is `job:$hash`, where $hash refers to a sha256 of
// the following parts, all separated by a colon
// the script's path
// all key value pairs sorted by key, with key & val concatenated with =
// The job {script: 'abc.js', iterations: 5, filter: 'ir'} would produce:
// sha256(abc.js:filter=ir:iterations=5)
Jobs.makeId = function(job) {
	if(!job.script) {
		throw new Error('No script defined for job');
	}
	var propKeys = Object.keys(job).filter(key => key !== 'script');
	var props = propKeys.sort().reduce((acc, key) => {
		var val = job[key];
		if(!allowedPropValTypes.has(typeof val)) {
			throw new Error(`Prop "${key}" is of non-supported type "${typeof val}"`);
		}
		return acc += `:${key}=${val}`;
	}, job.script);
	return jobHashToId(hash(props));
};

Jobs.prototype.add = function(job) {
	talk('add job', job);
	// Compute job id
	// Add props as a map to job:$job
	var jobId = Jobs.makeId(job);
	return Promise.all([
		this.redis.sadd(magicStrings.setOfJobs, jobId),
		this.redis.hmset(jobId, job),
	])
	.then(([wasNew, ]) => {
		if(wasNew) {
			this.redis.publish(magicStrings.newJobEvent, jobId);
		}
	})
	.catch(cry);
};

Jobs.prototype.get = function(jobId) {
	return this.redis.hgetall(jobId)
	.catch(cry);
};

Jobs.prototype.getMatching = function(pattern) {
	return this.getAllIds()
	.then(refs => refs.filter(ref => ref.startsWith(pattern)))
	.then(refs => {
		return Promise.all(refs.map(this.redis.hgetall));
	})
	.catch(cry);
};

function idMatchesRef(id, ref) {
	return id.startsWith(jobHashToId(ref));
}

Jobs.prototype.deref = function(ref) {
	return this.getAllIds()
	.then(ids => ids.find(id => idMatchesRef(ref, id)))
	.catch(cry)
};

Jobs.prototype.derefAll = function(picked) {
	return this.getAllIds()
	.then(ids => {
		return ids.filter(id => picked.find(idMatchesRef.bind(null, id)));
	})
	.catch(cry);
};


Jobs.prototype.getAllIds = function() {
	return this.redis.smembers(magicStrings.setOfJobs)
	.catch(cry);
};
Jobs.prototype.getAll = function() {
	return this.getAllIds()
	.then(refs => {
		return Promise.all(refs.map(this.get.bind(this)))
		.then(values => _.zipObject(refs, values));
	})
	.catch(cry);
};

Jobs.prototype.stop = function(jobId) {
	return Promise.all([
		this.redis.del(jobId),
		this.redis.srem('jobs', jobId),
	])
	.then(() => this.redis.publish(magicStrings.delJobEvent, jobId))
	.catch(cry);
};



Jobs.prototype.subscribe = function(fn) {
	var redis = new Redis();
	return redis.subscribe(magicStrings.newJobEvent)
	.then((count) => {
		redis.on('message', (channel, message) => {
			talk('on redis message', channel, message);
			if(channel === magicStrings.newJobEvent) {
				fn(message);
			}
		});
	})
	.catch(cry);
};

Jobs.prototype.close = function() {
	this.redis.disconnect();
};



module.exports = {
	Jobs,
	magicStrings,
};