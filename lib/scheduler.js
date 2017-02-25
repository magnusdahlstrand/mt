
var store = require('./store');

var jobs = store.getJobs();
var queue = store.getQueue();

function spawn(jobId) {
	jobs.get(jobId).then((job) => {
		console.log('got job', job);
		var module = require(job.script);
		var e = module.job(job);
		console.log(e);
	}).catch(err => console.error(err));
}


module.exports = {
	spawn
};