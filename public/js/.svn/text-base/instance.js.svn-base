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
                  clickable: true,
                  hoverable: false,
                  autoHighlight: false
                },
                legend: {
                  position: 'nw'
                }
              };

          self.plots[ id ].start = csv[ 0 ][ 0 ];
          self.plots[ id ].data = csv;
          self.plots[ id ].plot = $.plot( $content.attr( 'id', id ).resizable(), [ {
            data: csv.slice( 0, $content.width() / 8 ),
            label: filename + ' (start = ' + self.plots[ id ].start + ')'
          } ], options );

          $content.bind( 'plotselected', function( event, ranges ) {
            var to = Math.max( ranges.xaxis.to, ranges.xaxis.from + 0.00001 )
              , id = $content.attr( 'id' );

            self.plots[ id ].plot = $.plot( 
              $content, 
              [ { 
                data: self.plots[ id ].data.slice( ranges.xaxis.from, to ),
                label: filename + ' (start = ' + self.plots[ id ].start + ')'
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


      setStartTime: function( $content, event, onSuccess, onError ) {
        var self = this
          , id = $content.attr( 'id' )
          , plot, plotOffset, canvasX, canvasY, pos;

        if ( !event ) {
          self.plots[ id ].start = self.plots[ id ].data[ 0 ][ 0 ];
          self.jump( $content, 0 );
          onError();
        } else {
          plot = self.plots[ id ].plot;
          offset = $content.offset();
          plotOffset = plot.getPlotOffset();
          canvasX = event.pageX - offset.left - plotOffset.left;
          canvasY = event.pageY - offset.top - plotOffset.top;
          pos = plot.c2p( { left: canvasX, top: canvasY } );

          self.plots[ id ].start = Math.round( pos.x );
          self.jump( $content, 0 );
          onSuccess();
        }
      },


      toJSON: function( $content ) {
        return JSON.stringify( self.plots[ $content.attr( 'id' ) ].data );
      }
    }


  , videoHandler = {


      iam: 'video',

      /**
       * maps $content.attr( 'id' ) to information
       * about videos
       *
       * attributes:
       *     - start = the start time, measured in *seconds*
       */
      videos: {},


      when: function( filename ) {
        return filename.endsWith( '.webm' ) || filename.endsWith( '.mp4' );
      },


      read: function( reader, file ) {
        reader.readAsDataURL( file );
      },


      render: function( $content, pathname, filename ) {
        var self = this
          , id = unique( filename );

        self.videos[ id ] = {
          start: 0
        };

        $( '<video src="' + pathname + '" controls/>' ).appendTo( $content.attr( 'id', id ) );
      },


      type: function( file ) {
        return 'video/' + file.name.substring( file.name.lastIndexOf( '.' ) + 1 );
      },


      jump: function( $content, position ) {
        var self = this
          , id = $content.attr( 'id' )
          , video = $content.find( 'video' ).get( 0 );

        // start is measured in seconds
        // position is measured in milliseconds
        video.currentTime = self.videos[ id ].start + ( position / 1000 );
      },


      setStartTime: function( $content, event, onSuccess, onError ) {
        var self = this
          , id = $content.attr( 'id' )
          , video;

        if ( !event ) {
          self.videos[ id ].start = 0;
          self.jump( $content, 0 );
          onError();
        } else {
          video = $content.find( 'video' ).get( 0 );
          // start is measured in seconds
          self.videos[ id ].start = video.currentTime;
          self.jump( $content, 0 );
          onSuccess();
        }
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
 * finds the data item that's x value is next to
 * `position` in the flot data series `series`.
 *
 *     dataItemNextToPosition( [ [ 0, 4 ], [ 2, 6 ], [ 8, 3 ] ], 5 )
 *     // => [ 2, 6 ]
 *
 * @param series
 *        the data series the data item should be found in
 * @param position
 *        the position in milliseconds that should be found
 * @return the data item of `series` that is next to `position`
 */
function dataItemNextToPosition( series, position ) {
  var distance = Number.MAX_VALUE
    , dataitem = false
    , currentDistance;

  for ( var i = 0; i < series.length; i++ ) {
    currentDistance = Math.abs( position - series[ i ][ 0 ] );
    if ( currentDistance < distance ) {
      distance = currentDistance;
      dataitem = series[ i ];
    }
  }

  return dataitem;
}


/**
 * converts a csv file to a json array that can
 * be plotted by flotcharts
 *
 *     toFlotSeriesFormat( "1;123\n2;456\n3;789" )
 *     // => [ [ 1, 123 ], [ 2, 456 ], [ 3, 789 ] ]
 *
 * @param plain 
 *        the plain csv file content
 * @return the converted array
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
 *     unique( '#foo.bar' )
 *     // => '-foo-bar-trquln3xr'
 *
 * @param string
 *        any string
 * @return pseudo-unique id generated from `string`
 */
function unique( string ) {
  return string.replace( /[#\.]/g, '-' ) 
    + '-' 
    + Math.max( 0.0001, Math.random() ).toString( 36 ).substr( -10 );
}


$( document ).ready( function() {
  $main = $('#main-container').windowed( {
    handlers: [ csvHandler, videoHandler, kmlHandler ],
    uploadUrl: function( filename ) { return location.pathname + '/' + filename; }
  } );
} );