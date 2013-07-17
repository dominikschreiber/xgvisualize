var $main
  , csvHandler = {
      iam: 'chart',
      when: function( filename ) {
        return filename.endsWith('csv');
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
      },
      toJSON: function( $container ) {
        console.info( 'csv' );
      }
    }
  , videoHandler = {
      iam: 'video',
      when: function( filename ) {
        return filename.endsWith('webm') || filename.endsWith('mp4');
      },
      thenRead: function( reader, file ) {
        reader.readAsDataURL( file );
      },
      thenDo: function( $container, file, body ) {
        $( '<video src="' + body + '" alt="' + file.name + '" type="' + file.type + '" controls/>' ).appendTo( $container );
      },
      toJSON: function( $container ) {
        var video = $container.find( 'video' );

        return {
          src: video.attr( 'src' ),
          type: video.attr( 'type' )
        };
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