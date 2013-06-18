var main = document.getElementById('main-container');

main.addEventListener('dragenter', onDragEnter, false);
main.addEventListener('dragleave', onDragLeave, false);
main.addEventListener('dragover', onDragOver, false);
main.addEventListener('drop', onDrop, false);


function onDragEnter(event) {
  main.classList.add('active');
}


function onDragLeave(event) {
  if (event.pageY < 40)
    main.classList.remove('active');
}


function onDragOver(event) {
  consume(event);
}


function consume(event) {
  event.stopPropagation();
  event.preventDefault();
}


function onDrop(event) {
  var files;

  consume(event);
  main.classList.remove('active');

  files = event.dataTransfer.files;
  if (typeof files == 'undefined' || files.length === 0)
    return;

  for (var i = 0; i < files.length; i++) {
    var reader = new FileReader()
      , file = files[i];

    reader.onerror = function(e) {
      switch (e.target.error.code) {
        case 1: console.warn('File "' + file.name + '" not found.'); break;
        case 2: console.warn('File "' + file.name + '" has changed on disk. Please retry.'); break;
        case 3: console.warn('Upload of File "' + file.name + '" has been cancelled.'); break;
        case 4: console.warn('File "' + file.name + '" can not be read.'); break;
        case 5: console.warn('File "' + file.name + '" is too large to be uploaded by the browser.'); break;
      }
    };

    reader.onloadend = function(e) {
      persist(file, e.target.result);
    };

    if (isText(file.type))
      reader.readAsText(file);
    else if (isBinary(file.type))
      reader.readAsDataURL(file);
  }
}


function isText(type) {
  return type.match('text/*');
}


function isBinary(type) {
  return type.match('(video/*|image/*)');
}


function persist(file, body) {
  var data = {
    name: file.name,
    type: file.type,
    content: body
  };

  createInstance(function(id) {
    upload(id, data, function() {
      location.pathname = id;
    });
  });
}


function createInstance(next) {
  $.get('/new', function success(id) {
    next(id);
  });
}


function upload(id, data, next) {
  $.post('/' + id, JSON.stringify(data), function success(body) {
    if (next) next(body);
  });
}