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
       *        absolute url to a csv file like
       *            "1;234" +
       *            "2;345" +
       *            "3;456" ...
       * @param filename
       *        name of the file to be found at `url`. used to label
       *        the plotted graph
       * @param next
       *        callback to be called when the rendering is done
       */
      render: function( $content, url, filename, next ){
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

          self.plots[ id ].url = url;
          self.plots[ id ].name = filename;
          self.plots[ id ].start = csv[ 0 ][ 0 ];
          self.plots[ id ].data = csv;
          self.plots[ id ].markers = {};
          self.plots[ id ].plot = $.plot( 
            $content.attr( 'id', id ).resizable(), 
            [ {
              data: csv.slice( 0, $content.width() / 8 ),
              label: filename + ' (start = ' + self.plots[ id ].start + ')'
            } ].concat( self.toDataSeries( id, self.plots[ id ].markers ) ), 
            options );

          $content.bind( 'plotselected', function( event, ranges ) {
            self.select( $content, options, ranges.xaxis.from, ranges.xaxis.to, self );
          } );

          self.jump( $content, 0 );
          if ( next ) { next(); }
        } );
      },


      toDataSeries: function( id, markerObject ) {
        var self = this
          , series = []
          , data = self.plots[ id ].data
          , currentTime;

        for ( var key in markerObject ) {
          currentTime = parseInt( key );
          series.push( { 
            data: [ data[ currentTime ] ], 
            lines: { 
              show: false
            }, 
            points: {
              show: true,
              radius: 4,
              symbol: 'circle'
            },
            color: markerObject[ key ].color
          } );
        }

        return series;
      },


      select: function( $content, options, from, to, self, next ) {
        var id = $content.attr( 'id' )
          , data = [ {
              data: self.plots[ id ].data.slice( from, to ),
              label: self.plots[ id ].name + ' (start = ' + self.plots[ id ].start + ')'
            } ].concat( self.toDataSeries( id, self.plots[ id ].markers ) );

        to = Math.max( from + 0.00001, to );
        
        self.plots[ id ].plot = $.plot(
          $content,
          data,
          $.extend( true, options, {
            xaxis: {
              min: from + 1,
              max: to
            }
          } ) );
        self.plots[ id ].plot.highlight( 0, self.plots[ id ].currentIndexInSelection );

        if ( next ) { next(); }
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
          , id = $content.attr( 'id' );

        if ( !event ) {
          self.plots[ id ].start = self.plots[ id ].data[ 0 ][ 0 ];
          self.jump( $content, 0 );
          onError();
        } else {
          self.plots[ id ].start = Math.round( 
            self.getClickedDataItem( 
              id, 
              $content.offset(), 
              event.pageX, 
              event.pageY ).x 
            );
          self.jump( $content, 0 );
          onSuccess();
        }
      },


      getClickedDataItem: function( id, offset, x, y ) {
        var self = this
          , plot = self.plots[ id ].plot
          , plotOffset = plot.getPlotOffset()
          , canvasX = x - offset.left - plotOffset.left
          , canvasY = y - offset.top - plotOffset.top;

        console.log( plotOffset, offset, x, y , canvasX, canvasY );

        return plot.c2p( { left: canvasX, top: canvasY } );
      },


      setMarker: function( $content, marker, onSuccess ) {
        var self = this
          , id = $content.attr( 'id' )
          , info = self.plots[ id ]
          , item = self.getClickedDataItem( id, $content.offset(), marker.x, marker.y )
          , time = Math.round( item.x );

        self.plots[ id ].markers[ time ] = marker;
        self.jump( $content, 0 );

        onSuccess( time );
      },


      toJSON: function( $content ) {
        var self = this
          , id = $content.attr( 'id' )
          , info = self.plots[ id ]
          , xaxes = info.plot.getXAxes()[ 0 ];

        return {
          start: info.start,
          from: xaxes.min,
          to: xaxes.max,
          url: info.url,
          name: info.name
        }
      },


      fromJSON: function( $content, json ) {
        var self = this;

        self.render( $content, json.url, json.name, function next() {
          var id = $content.attr( 'id' )
            , info = self.plots[ id ];
        } );
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


      render: function( $content, url, filename, next ) {
        var self = this
          , id = unique( filename )
          , $video
          , video
          , canvas
          , ctx
          , devicePixelRatio = window.devicePixelRatio || 1
          , backingStoreRatio
          , ratio
          , oldWidth
          , oldHeight;

        self.videos[ id ] = {
          start: 0,
          markers: {},
          url: url,
          name: filename
        };

        $video = $( '<video src="' + url + '" controls preload="auto"/>' )
          .appendTo( $content.attr( 'id', id ) );
        video = $video.get( 0 );
        canvas = $( '<canvas class="marker-canvas">please use a browser that supports <code>canvas</code>.</canvas>' )
          .appendTo( $content )
          .get( 0 );
        ctx = canvas.getContext( '2d' );

        // canvas is quite pixelated on retina displays
        // so it is scaled if the display is hidpi
        backingStoreRatio = ctx.webkitBackingStorePixelRatio ||
          ctx.mozBackingStorePixelRatio ||
          ctx.msBackingStorePixelRatio ||
          ctx.oBackingStorePixelRatio ||
          ctx.backingStorePixelRatio || 1;
        ratio = devicePixelRatio / backingStoreRatio;

        // when the width+height of the video are known
        // the canvas is set to the exactly same dimensions
        video.addEventListener( 'loadedmetadata', function() { 
          oldWidth = canvas.width = $video.width();
          oldHeight = canvas.height = $video.height();

          if ( ratio !== 1 ) {
            canvas.width = oldWidth * ratio;
            canvas.height = oldHeight * ratio;
            canvas.style.width = oldWidth + 'px';
            canvas.style.height = oldHeight + 'px';
            ctx.scale( ratio, ratio );
          }
          canvas.style.marginLeft = '-' + ( oldWidth / 2 ) + 'px';
        } );

        // there is only one marker allowed for a certain time
        // and the marker is only visible at this very time
        video.addEventListener( 'timeupdate', function() {
          self.clearCanvas( canvas );

          // video.currentTime is in seconds, markers maps to milliseconds
          if ( video.currentTime * 1000 in self.videos[ id ].markers ) {
            self.drawMarker( canvas, self.videos[ id ].markers[ video.currentTime * 1000 ] );
          }
        } );

        if ( next ) { next(); }
      },


      clearCanvas: function( canvas ) {
        var ctx = canvas.getContext( '2d' );

        ctx.save();
        ctx.setTransform( 1, 0, 0, 1, 0, 0 );
        ctx.clearRect( 0, 0, canvas.width, canvas.height );
        ctx.restore();
      },


      /**
       * draws a marker, formed like a '+' with minimal
       * dimensions of 16px to the 2d-context of `canvas`
       *
       * WARNING: does not check for the existance of 
       * any 2d-context, you have to make sure that
       * `canvas.getContext( '2d' )` does not fail.
       *
       *     drawMarker( <80x30 canvas>, { x: 50, y: 10 } )
       *     // => ____+__
       *
       * @param canvas
       *        the html5 canvas the marker should be drawn
       *        to.
       */
      drawMarker: function( canvas, marker ) {
        var ctx = canvas.getContext( '2d' )
          , size = Math.max( canvas.width / 64, 16 )
          , bottomY = Math.min( Math.max( marker.y + size / 2, 0 ), canvas.height )
          , rightX = Math.min( Math.max( marker.x + size / 2, 0 ), canvas.width )
          , topY = Math.min( Math.max( marker.y - size / 2, 0 ), canvas.height )
          , leftX = Math.min( Math.max( marker.x - size / 2, 0 ), canvas.width );

        ctx.save();

        ctx.strokeStyle = marker.color;
        ctx.fillStyle = 'rgba(255, 255, 255, .6)';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.arc( marker.x, marker.y, size / 2, 0, Math.PI * 2 );
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo( leftX, marker.y );
        ctx.lineTo( rightX, marker.y );
        ctx.moveTo( marker.x, bottomY );
        ctx.lineTo( marker.x, topY );
        ctx.stroke();

        ctx.restore();
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


      setMarker: function( $content, marker, onSuccess ) {
        var self = this
          , video = $content.find( 'video' ).get( 0 )
          , canvas = $content.find( 'canvas' ).get( 0 );

        self.videos[ $content.attr( 'id' ) ].markers[ video.currentTime * 1000 ] = { 
          x: marker.x, 
          y: marker.y,
          color: marker.color
        };

        self.clearCanvas( canvas );
        self.drawMarker( canvas, { x: marker.x, y: marker.y, color: marker.color } );       

        onSuccess( video.currentTime * 1000 ); // video.currentTime is in seconds
      },


      toJSON: function( $content ) {
        var self = this
          , info = self.videos[ $content.attr( 'id' ) ];

        return {
          start: info.start,
          currentTime: $content.find( 'video' ).get( 0 ).currentTime,
          url: info.url,
          name: info.name
        }
      },


      fromJSON: function( $content, json ) {
        var self = this;

        self.render( $content, json.url, json.name, function next() {
          var id = $content.attr( 'id' );

          self.videos[ id ].start = json.start;
          $content.find( 'video' ).get( 0 ).currentTime = json.currentTime;
        } );
      }
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
    uploadUrl: function( filename ) { return location.pathname + '/' + filename + '/'; },
    markerUrl: '/marker/' + location.pathname.substr( -6 ) + '/'
  } );
} );