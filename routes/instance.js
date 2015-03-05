var nano = require( 'nano' )( process.env.DBHOST || 'http://dominikschreiber:BUlTBiQIXz@81.169.133.153:5984' )
  , instances = nano.use( process.env.DB || 'xgv' )
  , fs = require( 'fs' )
  , path = require( 'path' );


// ===== create a new instance ================================================

exports.create = function( req, res ) {
  create( function onSuccess( id ) {
    res.send( id );
  }, function onError( err ) {
    error( err, res, 500 );
  } );
};


function create( onSuccess, onError ) {
  instances.list( function( listError, listBody ) {
    if ( listError ) {
      onError( listError )
    } else {
      var id = generateNewInstanceID( listBody.rows );
      instances.insert( { 
        structure: {
          height: '100%',
          width: '100%',
          top: 0,
          left: 0,
          'z-index': 0,
          file: false,
          children: []
        },
        markers: {}
      }, id, function( insertError, insertBody ) {
        if ( insertError ) {
          onError( insertError );
        } else {
          onSuccess( id );
        }
      } );
      fs.mkdir( path.resolve( __dirname, '..', 'static/' + id ) );
    }
  } );
}


function error( error, res, statuscode ) {
  console.warn( '[warn]', statuscode, error.message, '\n' + ( ( error.stacktrace ) ? error.stacktrace.join('\n') : '' ) );
  res.type( 'text/plain' );
  if ( statuscode ) {
    res.status( statuscode );
  }
  res.send( error.message );
}


function generateNewInstanceID(documents) {
  var id = generateInstanceID();
  for (var i = 0; i < documents.length; i++) {
    if (documents[i].id == id) {
      id = generateInstanceID();
      i = 0;
    }
  }
  return id;
}


function generateInstanceID() {
  var fullID = Math.max(0.001, Math.random()).toString(36);
  return fullID.substring(fullID.length-6).toUpperCase();
}


// ===== render home page without known instance ==============================


exports.workspace = function(req, res) {
  var id = req.params.id;

  if ( !id ) {
    create( function onSuccess( newID ) {
      res.redirect( '/' + newID );
    }, function onError( err ) {
      error( err, res, 500 );
    } );
  } else {
    instances.get( id, function( getError, getBody ) {
      if ( getError ) {
        error( getError, res, 400 );
      } else {
        res.render( 'workspace', {
          title: 'xgvisualize'
        } );
      }
    } );
  }
};


// ===== serve requested file =================================================


exports.file = function( req, res ) {
  var range
    , parts
    , partialStart
    , partialEnd
    , total
    , start
    , end;

  fs.readFile( path.resolve( __dirname, '..', 'static/' + req.params.id + '/' + sanitize( req.params.file ) ), function( err, file ) {
    if ( err ) {
      error( err, res, 500 );
    } else {
      res.type( typeFromName( req.params.file ) );
      // HTTP RANGE support for searching in videos
      if ( typeof req.headers.range !== 'undefined' ) {
        range = req.headers.range;
        parts = range.replace( /bytes=/, '' ).split( '-' );
        partialStart = parts[ 0 ];
        partialEnd = parts[ 1 ];
        total = file.length;
        start = parseInt( partialStart, 10 );
        end = partialEnd ? parseInt( partialEnd, 10 ) : total - 1;

        res.set( {
          'Content-Range': 'bytes ' + start + '-' + end + '/' + (total),
          'Accept-Ranges': 'bytes',
          'Content-Length': ( end - start ) + 1,
          'Transfer-Encoding': 'chunked',
          'Connection': 'close'
        } );
        res.send( 206, file.slice( start, end ) );
      }
      // send file the normal way if HTTP RANGE is not needed
      else {
        res.send( file );
      }
    }
  })
};


// ===== handle file attachment ===============================================


exports.attach = function( req, res ) {
  var id = req.params.id
    , filename = sanitize( req.params.file )
    , data = req.body.file
    , fspath = path.resolve( __dirname, '..', 'static/' + id + '/' + filename );

  console.log( fspath );

  fs.writeFile( fspath, data.substring( data.indexOf( ';base64,' ) + 8 ), 'base64', function() {
    res.send( '/' + id + '/' + filename );
  } );
};


function sanitize( filename ) {
  return filename.toLowerCase().replace(/[\s\/\_]/g, '-').replace('ä', 'a').replace('ö', 'o').replace('ü', 'u').replace('ß', 'ss');
}


function typeFromName( filename ) {
    switch ( filename.substring( filename.lastIndexOf( '.' ) + 1 ) ) {
      case 'webm': return 'video/webm';
      case 'mp4': return 'video/mp4';
      case 'kml': return 'application/vnd.google-earth.kml+xml';
      case 'csv': return 'text/csv';
      default: return 'text/plain';
    }
}


// ===== get markers ==========================================================


exports.getMarkers = function( req, res ) {
  instances.get( req.params.id, function( getError, getBody ) {
    if ( getError ) {
      error( getError, res, 500 );
    } else {
      res.json( getBody.markers );
    }
  } );
};


// ===== set a new marker =====================================================


exports.addMarker = function( req, res ) {
  addMarker( 
    req.params.id,
    req.body,
    function onSuccess() {
      res.send( req.path );
    },
    function onError( err ) {
      error( err, res, 400 );
    } );
};


function addMarker( id, marker, onSuccess, onError ) {
  instances.get( id, function( getError, getBody ) {
    if ( getError ) {
      onError( getError );
    } else {
      getBody.markers[ marker.time ] = marker;
      instances.insert( getBody, id, function( insertError, insertBody ) {
        if ( insertError ) {
          onError( insertError );
        } else {
          onSuccess();
        }
      } );
    }
  } );
}


// ===== structure ============================================================


exports.getStructure = function( req, res ) {
  var id = req.params.id;

  instances.get( id, function( getError, getBody ) {
    if ( getError ) {
      error( getError, res, 500 );
    } else {
      res.json( getBody.structure );
    }
  } );
}


exports.setStructure = function( req, res ) {
  var id = req.params.id
    , structure = req.body;

  instances.get( id, function( getError, getBody ) {
    if ( getError ) {
      error( getError, res, 400 );
    } else {
      getBody.structure = structure;
      instances.insert( getBody, id, function( insertError, insertBody ) {
        if ( insertError ) {
          error( insertError, res, 500 );
        } else {
          res.send( req.path );
        }
      } );
    }
  } );
}