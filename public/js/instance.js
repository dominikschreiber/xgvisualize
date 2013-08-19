var $main


  , csvHandler = {

      plots: {},

      iam: 'chart',

      when: function( filename ) {
        return filename.endsWith('.csv');
      },

      read: function( reader, file ) {
        reader.readAsBinaryString( file );
      },

      render: function( $content, pathname, id ){
        var self = this;

        id = unique( id );
        self.plots[ id ] = {};

        $.get( pathname ).done( function( body ) {
          var csv = toPlottableCsv( body );

          self.plots[ id ].startX = csv[ 0 ][ 0 ];
          self.plots[ id ].plot = $.plot( $content.attr( 'id', id ).resizable(), [ {
            data: csv
          } ], {
            crosshair: {
              mode: 'xy',
              color: 'rgba(50, 150, 190, .5)'
            },
            grid: {
              hoverable: false,
              autoHighlight: false
            }
          } );
          self.plots[ id ].plot.lockCrosshair( {
            x: csv[ 0 ][ 0 ],
            y: csv[ 0 ][ 1 ]
          } );
        } );
      },

      type: function( file ) {
        return 'text/csv';
      },

      /**
       * plots a xy-crosshair aiming at the value at the given position
       * into the chart in $content.
       *
       * WARNING: makes heavy assumptions that the chart in $content has
       * an entry for _every_millisecond_. Once that is not the case, the
       * computation has to be generalized (TODO).
       *
       * @param $content the jQuery Object containing the plotted chart.
       *        is assumed to have a unique ID that is already recognized
       *        in self.plots (to get the plot object from there)
       * @param position the position in milliseconds from the start value
       *        to be highlighted.
       */
      jump: function( $content, position ) {
        var self = this
          , id = $content.attr( 'id' )
          , data = self.plots[ id ]
          , plot = data.plot
          , plotData = plot.getData()[ 0 ].data
          , relativePosition = Math.min( Math.max( data.startX + position, 1 ), plotData.length - 1 ) - 1;

        plot.lockCrosshair( {
          x: relativePosition + 1,
          y: plotData[ relativePosition ][ 1 ]
        } );
      },

      toJSON: function( $content ) {}
    }


  , videoHandler = {

      iam: 'video',

      when: function( filename ) {
        return filename.endsWith( '.webm' ) || filename.endsWith( '.mp4' );
      },

      read: function( reader, file ) {
        reader.readAsDataURL( file );
      },

      render: function( $content, pathname, id ) {
        $( '<video src="' + pathname + '" controls/>' ).appendTo( $content );
      },

      type: function( file ) {
        return 'video/' + file.name.substring( file.name.lastIndexOf( '.' ) + 1 );
      },

      jump: function( $content, position ) {
        $content.find( 'video' ).get( 0 ).currentTime = position / 1000;
      },

      toJSON: function( $content ) {}
    }


  , kmlHandler = {

    iam: 'map',

    when: function( filename ) {
      return filename.endsWith('.kml');
    },

    read: function( reader, file ) {
      reader.readAsBinaryString( file );
    },

    render: function( $content, pathname, id ) {
      var map
        , kml;

      $( '<div/>' ).attr( 'id', id ).appendTo( $content );

      map = new google.maps.Map( document.getElementById( id ), {
        center: new google.maps.LatLng( 49.874819, 8.660523 ),
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      } );

      kml = new google.maps.KmlLayer( {
        url: location.protocol + '//' + location.host + pathname,
        map: map
      } );

      if ( kml.getDefaultViewport() )
        map.fitBounds( kml.getDefaultViewport() );
    },

    type: function( file ) {
      return 'application/vnd.google-earth.kml+xml';
    },

    jump: function( $content, position ) {
      console.log( speed );
    },

    toJSON: function( $content ) {}
  };

/**
 * converts a csv file to a json array that can
 * be plotted by flotcharts
 *
 * @param plain the plain csv file content, i.e.
 *     "1;123\n" +
 *     "2;456\n" +
 *     "3;789"
 * @return the converted array, i.e.
 *     [
 *       [ 1, 123 ],
 *       [ 2, 456 ],
 *       [ 3, 789 ]
 *     ]
 */
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

/**
 * Takes an arbitrary string and adds a random 10-char string
 * to make it unique (at least by a high probability). Does *not*
 * test that the result is truly unique, just relies on the random
 * 10-char string to be unique.
 *
 * @param id any string, i.e.
 *     "my-unique-string"
 * @return pseudo-unique id generated from this string, i.e.
 *     "my-unique-string-trqulnb3xr"
 */
function unique( id ) {
  return id + '-' + Math.max( 0.0001, Math.random() ).toString( 36 ).substr( -10 );
}


$(document).ready(function() {
  $main = $('#main-container').windowed({
    handlers: [ csvHandler, videoHandler, kmlHandler ],
    uploadUrl: function( filename ) { return location.pathname + '/' + filename; }
  });
});