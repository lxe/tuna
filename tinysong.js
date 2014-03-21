var request = require('request')

module.exports = exports = function(q, callback, limit) {
  request('http://tinysong.com/s/' + q, {
    qs : {
      format : 'json',
      limit  : limit || 10,
      key    : 'd314eb802329de50bfd21867587958d4'
    }
  }, function(error, response, body) {
    if (error) return callback(error);
    return callback(null, body)
  })
}
