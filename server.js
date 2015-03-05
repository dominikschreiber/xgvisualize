var express = require( 'express' )
  , http = require( 'http' )
  , path = require( 'path' )
  , index = require( './routes/index.js' )
  , instance = require( './routes/instance.js' );
 
var app = express();

app.configure(function() {
  app.set( 'port', process.env.PORT || 9273 );
  app.set( 'views', __dirname + '/views' );
  app.set( 'view engine', 'ejs' );

  app.use( express.favicon( __dirname + '/public/img/favicon.ico' ) );
  app.use( express.logger( 'dev' ) );

  app.use( express.bodyParser( {
    keepExtensions: true,
    maxFieldsSize: 2 * 1024 * 1024 * 1024,
    uploadDir: __dirname + '/tmp'
  } ) );
  app.use( express.methodOverride() );
  app.use( app.router );
  app.use( require( 'less-middleware' )( { src: __dirname + '/public' } ) );
  app.use( express.static( path.join( __dirname, 'public' ) ) );
});

app.configure( 'development', function() {
  app.use( express.errorHandler() );
} );


app.get( '/', instance.workspace );
app.get( '/:id([A-Z0-9]{6})', instance.workspace );

app.get( '/marker/:id([A-Z0-9]{6})', instance.getMarkers );
app.post( '/marker/:id([A-Z0-9]{6})', instance.addMarker );

app.get( '/structure/:id([A-Z0-9]{6})', instance.getStructure );
app.post( '/structure/:id([A-Z0-9]{6})', instance.setStructure );

app.get( '/:id([A-Z0-9]{6})/:file', instance.file );
app.post( '/:id([A-Z0-9]{6})/:file', instance.attach );


http.createServer( app ).listen( app.get( 'port' ), function() {
  console.log( 'Server listening on port ' + app.get( 'port' ) );
});
