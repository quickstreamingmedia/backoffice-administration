'use strict';

var objectlength = function(obj) {
	var result_length = 0;
	for (var key in obj) {
		if (Object.prototype.hasOwnProperty.call(obj, key)) {
			result_length++;
		}
	}
	return result_length;
};

module.exports = objectlength;