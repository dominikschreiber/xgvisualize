var nano = require('nano')(process.env.DBHOST || 'http://dominikschreiber:BUlTBiQIXz@81.169.133.153:5984')
  , instances = nano.use(process.env.DB || 'dsa');


exports.create = function(req, res) {
  instances.list(function (listError, listBody) {
    if (listError) {
      error(listError.message, res);
    } else {
      var id = generateNewInstanceID(listBody.rows);
      instances.insert({}, id, function(insertError, insertBody) {
        res.writeHead('Content-Type', 'application/json');
        res.end(id);
      });
    }
  });
};


function error(message, res) {
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
    console.log(i, id);
  }
  return id;
}


function generateInstanceID() {
  var fullID = Math.max(0.001, Math.random()).toString(36);
  return fullID.substring(fullID.length-6).toUpperCase();
}


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
          res.writeHead('Content-Type', 'application/json');
          res.end('successfully uploaded "' + data.name + '"');
        }
      });
    }
  });
};