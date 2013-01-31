/**
 * 
 */

var request = require('request')
  , ts = require('./tinysong')

module.exports = exports = function(app) {

  /**
   * Search songs
   */
  app.get('/search/:q', function(req, res) {
    var q = req.param('q');
    if (!q || !q.length) return res.send(400)
    ts(q, function(err, results) {
      if (err || !results || !results.length) return res.send(400)
      res.send(results)
    })
  })


}