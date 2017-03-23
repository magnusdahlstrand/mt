var crypto = require('crypto');

function hash(msg) {
	return crypto.createHash('sha256').update(msg).digest('hex');
}

function talk(...msgs) {
	console.log(...msgs);
}

function cry(...errs) {
	console.error(...errs);
}


module.exports = {
	hash,
	talk,
	cry,
};