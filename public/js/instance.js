var $main
  , csvHandler = {
      iam: 'chart',
      when: function( filetype ) {
        return filetype.match('text/csv');
      },
      thenRead: function( reader, file ) {
        reader.readAsText( file );
      },
      thenDo: function( $container, file, body ){
        $.plot( $container, [{
          label: file.name,
          data: toPlottableCsv( body )
        }], {
          crosshair: {
            mode: 'x'
          },
          grid: {
            hoverable: true,
            autoHighlight: false
          }
        });

        $container.resizable();
      }
    }
  , videoHandler = {
      iam: 'video',
      when: function( filetype ) {
        return filetype.match('video/*');
      },
      thenRead: function( reader, file ) {
        reader.readAsDataURL( file );
      },
      thenDo: function( $container, file, body ) {
        $( '<video src="' + body + '" alt="' + file.name + '" type="' + file.type + '" controls/>' ).appendTo( $container );
      }
    };

$(document).ready(function() {
  $main = $('#main-container').windowed({
    handlers: [ csvHandler, videoHandler ]
  });
});


function toPlottableCsv( plain ) {
  var plot = [];

  plain = plain.split( '\n' );

  for ( var line = 0; line < plain.length; line++ ) {
    var chunks = plain[ line ].split( ';' )
      , plottable = [];

    for ( var chunk = 0; chunk < chunks.length; chunk++ ) {
      plottable.push( parseInt( chunks[ chunk ], 10 ) );
    }

    plot.push( plottable );
  }

  return plot;
}