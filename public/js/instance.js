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


      /**
       * Plots the content of the file found at `url`
       * as a line graph into `$content` using the flotcharts
       * library.
       *
       * Adds a unique id generated from `filename` to `$content`.
       * 
       * Binds redrawing functionality to the `plotselected`-Event
       * fired on `$content`. This is used to zoom around the
       * current selection when navigating content.
       *
       * @param $content
       *        the jQuery DOM Object that will be the placeholder
       *        for the plot
       * @param url
       *        absolute url to a csv file in the form
       *            "1;234" +
       *            "2;345" +
       *            "3;456" ...
       * @param filename
       *        name of the file to be found at `url`. used to label
       *        the plotted graph
       */
      render: function( $content, url, filename ){
        var self = this;

        id = unique( filename );
        self.plots[ id ] = {};

        $.get( url ).done( function( body ) {
          var csv = toFlotSeriesFormat( body )
            , options = {
                crosshair: {
                  mode: 'x',
                },
                selection: {
                  mode: 'x'
                },
                grid: {
                  hoverable: false,
                  autoHighlight: false
                }
              };

          self.plots[ id ].start = csv[ 0 ][ 0 ];
          self.plots[ id ].data = csv;
          self.plots[ id ].plot = $.plot( $content.attr( 'id', id ).resizable(), [ {
            data: csv.slice( 0, $content.width() / 8 ),
            label: filename
          } ], options );

          $content.bind( 'plotselected', function( event, ranges ) {
            var to = Math.max( ranges.xaxis.to, ranges.xaxis.from + 0.00001 )
              , id = $content.attr( 'id' );

            self.plots[ id ].plot = $.plot( 
              $content, 
              [ { 
                data: self.plots[ id ].data.slice( ranges.xaxis.from, to ),
                label: filename + '\n[ ' + ranges.xaxis.from.toFixed() + ' : ' + to.toFixed() + ' ]'
              } ], 
              $.extend( true, options, {
                xaxis: {
                  min: ranges.xaxis.from + 1,
                  max: to
                }
              } ) );
            self.plots[ id ].plot.highlight( 0, self.plots[ id ].currentIndexInSelection );
          } );

          self.jump( $content, 0 );
        } );
      },


      type: function( file ) {
        return 'text/csv';
      },


      /**
       * WARNING: makes heavy assumptions that the chart in $content has
       * an entry for _every_millisecond_. Once that is not the case, the
       * computation has to be generalized (TODO).
       *
       * @param $content 
       *        the jQuery Object containing the plotted chart. is assumed
       *        to have a unique ID that is already recognized in self.plots
       *        (to get the plot object from there)
       * @param position
       *        the position in milliseconds from the start value to be
       *        highlighted.
       */
      jump: function( $content, position ) {
        var self = this
          , id = $content.attr( 'id' )
          , info = self.plots[ id ]
          , plot = info.plot
          , center = Math.min( Math.max( info.start + position, 0 ), info.data.length - 1 ) - 1 // 0-indexed
          , selectionSize = plot.width() / 8
          , indexInSelection = Math.round( Math.min( center, Math.max( selectionSize - ( info.data.length - 1 - center ), selectionSize / 2 ) ) )
          , leftBound = center - selectionSize / 2
          , rightBound = center + selectionSize / 2
          , fromPosition = Math.floor( Math.max( Math.min( leftBound, info.data.length - selectionSize - 1 ), 0 ) )
          , toPosition = Math.ceil( Math.max( Math.min( rightBound, info.data.length - 1 ), selectionSize ) );

        info.currentIndexInSelection = indexInSelection;

        plot.setSelection( {
          xaxis: {
            from: fromPosition,
            to: toPosition
          }
        } );
      },


      toJSON: function( $content ) {
        return JSON.stringify( self.plots[ $content.attr( 'id' ) ].data );
      }
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
 * @param plain 
 *        the plain csv file content, i.e.
 *            "1;123\n" +
 *            "2;456\n" +
 *            "3;789"
 * @return the converted array, i.e.
 *            [
 *              [ 1, 123 ],
 *              [ 2, 456 ],
 *              [ 3, 789 ]
 *            ]
 */
function toFlotSeriesFormat( plain ) {
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
 * @param string
 *        any string, i.e.
 *            "my-unique-string"
 *            "#foo.bar"
 * @return pseudo-unique id generated from this string, i.e.
 *            "my-unique-string-trqulnb3xr"
 *            "-foo-bar"
 */
function unique( string ) {
  return string.replace( /[#\.]/g, '-' ) + '-' + Math.max( 0.0001, Math.random() ).toString( 36 ).substr( -10 );
}


$( document ).ready( function() {
  $main = $('#main-container').windowed( {
    handlers: [ csvHandler, videoHandler, kmlHandler ],
    uploadUrl: function( filename ) { return location.pathname + '/' + filename; }
  } );
} );