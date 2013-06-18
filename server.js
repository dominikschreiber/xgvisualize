var express = require('express')
  , http = require('http')
  , path = require('path')
  , index = require('./routes/index.js')
  , instance = require('./routes/instance.js');

var app = express();

app.configure(function() {
  app.set('port', process.env.PORT || 9273);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  app.use(express.favicon(__dirname + '/public/img/favicon.ico'));
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(require('less-middleware')({ src: __dirname + '/public' }));
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
  app.use(express.errorHandler());
});

app.get('/', index.home);

app.get('/new', instance.create);
app.get('/:id([A-Z0-9]{6})', instance.workspace);
app.post('/:id([A-Z0-9]{6})', instance.upload);

http.createServer(app).listen(app.get('port'), function() {
  console.log("Server listening on port " + app.get('port'));
});
