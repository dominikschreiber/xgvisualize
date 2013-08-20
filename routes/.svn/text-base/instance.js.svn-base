var nano = require( 'nano' )( process.env.DBHOST || 'http://dominikschreiber:BUlTBiQIXz@81.169.133.153:5984' )
  , instances = nano.use( process.env.DB || 'xgv' );


// ===== create a new instance ================================================

exports.create = function( req, res ) {
  instances.list( function ( listError, listBody ) {
    if ( listError ) {
      error( listError, res, 500 );
    } else {
      var id = generateNewInstanceID( listBody.rows );
      instances.insert( {}, id, function( insertError, insertBody ) {
        res.send( id );
      });
    }
  });
};


function error( error, res, statuscode ) {
  console.warn( '[warn]', statuscode, error.message, '\n' + error.stacktrace.join('\n') );
  res.type( 'text/plain' );
  if ( statuscode ) res.status( statuscode );
  res.send( error.message );
}


function generateNewInstanceID(documents) {
  var id = generateInstanceID();
  console.log(id);
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

  instances.get(id, function(getError, getBody) {
    if (getError) {
      error(getError, res, 400);
    } else {
      res.render('workspace', {
        title: 'xgvisualize'
      });
    }
  });
};


// ===== handle file upload (DEPRECATED) ======================================


exports.upload = function(req, res) {
  var id = req.params.id
    , data = req.body;

  instances.get(id, function(getError, getBody) {
    if (getError) {
      error(getError, res, 400);
    } else {
      getBody[data.name] = {
        type: data.type,
        content: data.content
      };

      instances.insert(getBody, id, function(insertError, insertBody) {
        if (insertError) {
          error(insertError, res, 500);
        } else {
          res.send('successfully uploaded "' + data.name + '"');
        }
      });
    }
  });
};


// ===== handle file attachment ===============================================


exports.attach = function( req, res ) {
  var id = req.params.id
    , filename = sanitize( req.params.file )
    , data = req.body.data;

  instances.get( id, function( getError, getBody ) {
    if( getError ) {
      error( getError, res, 400 );
    } else {
      if ( data.indexOf( 'data:' ) === 0 ) {
        getBody[ filename ] = data;
        instances.insert( getBody, id, function( insertError, insertBody ) {
          if ( insertError ) {
            error( insertError, res, 500 );
          } else {
            res.send( data );
          }
        } );
      } else {
        instances.attachment.insert( id, filename, req.body.data, req.body.type, { rev: getBody._rev }, function(attachmentInsertError, attachmentInsertBody) {
          if (attachmentInsertError) {
            error( attachmentInsertError, res, 500 );
          } else {
            if( attachmentInsertBody.ok ) res.send( '/' + attachmentInsertBody.id + '/' + filename );
          }
        });
      }
    }
  });
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


// ===== serve requested file =================================================


exports.file = function(req, res) {
  var fileEnding = req.params.file.substring( req.params.file.lastIndexOf( '.' ) + 1 );

  if ( fileEnding == 'webm' || fileEnding == 'mp4' ) {
    instances.get( req.params.id, function( getError, getBody ) {
      // TODO
      if ( getError ) {
        error( getError, res, 400 );
      } else {
        res.type( 'video/' + fileEnding );
        res.send( new Buffer( getBody[ req.params.file ], 'base64' ) );
      }
    } );
  } else {
    instances.attachment.get(req.params.id, req.params.file, function( attachmentGetError, attachmentGetBody ) {
      if ( attachmentGetError ) error( attachmentGetError );
      else res.send( attachmentGetBody );
    } );
  }
}