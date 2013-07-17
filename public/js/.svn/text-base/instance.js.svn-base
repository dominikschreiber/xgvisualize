var $main
  , csvHandler = {
      iam: 'chart',
      when: function( filename ) {
        return filename.endsWith('.csv');
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
        return filename.endsWith('.webm') || filename.endsWith('.mp4');
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
    }
  , kmlHandler = {
    iam: 'map',
    when: function( filename ) {
      return filename.endsWith('.kml');
    },
    thenRead: function( reader, file ) {
      reader.readAsBinaryString( file );
    },
    thenDo: function( $container, file, body ) {
      $.post( location.pathname + '/attach', {
        name: file.name,
        type: 'application/vnd.google-earth.kml+xml',
        data: body
      } ).done(function( pathname ) {
        var id = pathname.substring( pathname.lastIndexOf( '/' ) + 1 )
          , map
          , kml;

        $( '<div/>' ).attr( 'id', id ).appendTo( $container );

        map = new google.maps.Map(document.getElementById(id), {
          center: new google.maps.LatLng(49.874819, 8.660523),
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        });

        kml = new google.maps.KmlLayer({
          url: location.protocol + '//' + location.host + pathname,
          map: map
        });

        if (kml.getDefaultViewport())
          map.fitBounds(kml.getDefaultViewport());
      });
    },
    toJSON: function( $container ) {
      console.info( 'kml' );
    }
  };

$(document).ready(function() {
  $main = $('#main-container').windowed({
    handlers: [ csvHandler, videoHandler, kmlHandler ]
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