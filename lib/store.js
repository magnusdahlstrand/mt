var Redis = require('ioredis');
var crypto = require('crypto');

var allowedTypes = new Set([
	typeof "",
	typeof 1,
	typeof false,
]);

function hash(msg) {
	return crypto.createHash('sha256').update(msg).digest('hex');
}

// Job ID is `job:$hash`, where $hash refers to a sha256 of
// the following parts, all separated by a colon
// the script's path
// all key value pairs sorted by key, with key & val concatenated with =
// The job {script: 'abc.js', iterations: 5, filter: 'ir'} would produce:
// sha256(abc.js:filter=ir:iterations=5)
function makeJobId(job) {
	if(!job.script) {
		throw new Error('No script defined for job');
	}
	var propKeys = Object.keys(job).filter(key => key !== 'script');
	var message = propKeys.sort().reduce((acc, key) => {
		var val = job[key];
		if(!allowedTypes.has(typeof val)) {
			throw new Error(`Prop "${key}" is of non-supported type "${typeof val}"`);
		}
		return acc += `:${key}=${val}`;
	}, job.script);
	return `job:${hash(message)}`;
}

var queueFns = {
	add: (job) => {
		console.log('add job', job);
		var redis = new Redis();
		// Compute job id
		// Add props as a map to job:$job
		var jobId = makeJobId(job);
		redis.hmset(jobId, job)
		.then(() => {
			return redis.publish('queue', jobId)
			.then(() => {
				redis.disconnect();
			})
		})
		.catch(err => console.error(err));

	},
	subscribe: (fn) => {
		var redis = new Redis();
		return redis.subscribe('queue')
		.then((count) => {
			redis.on('message', (channel, message) => {
				console.log('on redis message', channel, message);
				if(channel === 'queue') {
					fn(message);
				}
			});
		});
	}
};

module.exports = {
	getQueue: function() {
		return queueFns;
	},
	getJobs: function() {
		var redis = new Redis();
		return {
			get: (jobId) => {
				return redis.hgetall(jobId);
			}
		}
	},
}