var express = require('express')
  , request = require('request')
  , connect = require('express/node_modules/connect')
  , port    = process.env.PORT || 3010;

var app = express();

app.configure(function() {
  app.use(connect.cookieParser()); 
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
});

app.get('/api/ts', function(req, res, error) {
  var ts_key = 'd314eb802329de50bfd21867587958d4';

  request({
    uri : 'http://tinysong.com/s/' + req.query.q,
    qs  : {
      limit  : 30,
      format : 'json',
      key    : ts_key
    }
  }, function(error, response, body) {
    if (error) return next(error);
    res.set('content-type', 'application/x-json')
    res.send(body)
  });
});

app.listen(port, function() {
  console.log('Tuna server on :', port);
});
