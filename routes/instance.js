var nano = require('nano')(process.env.DBHOST || 'http://dominikschreiber:BUlTBiQIXz@81.169.133.153:5984')
  , instances = nano.use(process.env.DB || 'xgv');


// ===== create a new instance ================================================

exports.create = function(req, res) {
  instances.list(function (listError, listBody) {
    if (listError) {
      error(listError.message, res);
    } else {
      var id = generateNewInstanceID(listBody.rows);
      instances.insert({}, id, function(insertError, insertBody) {
        res.send(id);
      });
    }
  });
};


function error(message, res) {
  console.warn('warn', message);
  res.writeHead('Content-Type', 'text/plain');
  res.end(message);
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
      error(getError.message, res);
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
      error(getError.message, res);
    } else {
      getBody[data.name] = {
        type: data.type,
        content: data.content
      };

      instances.insert(getBody, id, function(insertError, insertBody) {
        if (insertError) {
          error(insertError.message, res);
        } else {
          res.send('successfully uploaded "' + data.name + '"');
        }
      });
    }
  });
};


// ===== handle file attachment ===============================================


exports.attach = function(req, res) {
  var id = req.params.id
    , filename = sanitize(req.body.name)
    , data = req.body.data;

  instances.get(id, function(getError, getBody) {
    if(getError) {
      error(getError.message, res);
    } else {
      instances.attachment.insert(id, filename, data, req.body.type, { rev: getBody._rev }, function(attachmentInsertError, attachmentInsertBody) {
        if (attachmentInsertError) {
          error(attachmentInsertError.message, res);
        } else {
          res.end('/' + id + '/' + filename);
        }
      });
    }
  })
};


function sanitize( filename ) {
  return filename.toLowerCase().replace(/[\s\/\_]/g, '-').replace('ä', 'a').replace('ö', 'o').replace('ü', 'u').replace('ß', 'ss');
}


// ===== serve requested file =================================================


exports.file = function(req, res) {
  var id = req.params.id
    , filename = req.params.file;

  instances.attachment.get(id, filename, function(attachmentGetError, attachmentGetBody) {
    if (attachmentGetError) {
      error(attachmentGetError.message, res);
    } else {
      res.send(attachmentGetBody);
    }
  });
}