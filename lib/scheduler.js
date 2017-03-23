
var {Jobs} = require('./store');
var jobs = new Jobs();
var {talk, cry} = require('./utils');

var running = {};

function spawn(jobId) {
	jobs.get(jobId).then((job) => {
		talk('got job', job);
		var module = require(job.script);
		running[jobId] = module.job(job);
		talk('running', running[jobId]);
	}).catch(cry);
}


function* schedulerGen() {
	var job;
	while(true) {
		job = yield;
		talk('scheduler got a job', job);
		spawn(job);
	}
}

module.exports = {
	create: () => {
		var jobs = new Jobs();
		var scheduler = schedulerGen();
		// run it once since it doesn't do anything first time
		scheduler.next(null);
		jobs.subscribe({
			'new:job': jobId => {
				scheduler.next(jobId);
			},
			'del:job': jobId => {
				talk('stop', jobId, running);
				running[jobId].stop();
				delete running[jobId];
			}
		})
		.catch(cry);
	}
};