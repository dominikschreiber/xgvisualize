;

( function ( $, window, document, undefined ) {
    var pluginName = "windowed",
        defaults = {
            // windows are only split if both new elements are higher than this value
            minHeight: 150,
            // windows are only split if both new elements are wider than this value
            minWidth: 150, 
            // the mouse pointer must be that much pixels away from the border to trigger resizing
            resizeDistance: 10,
            // this is an array of objects of the form
            // {
            //   iam: String, -> class added to $content for this handler
            //   when: function( filename ), -> if this condition holds
            //   read: function( reader, file ), -> the reader should read the file that way
            //   render: function( $content, url, filename ), -> and it should be processed that way
            //   type: function( file ), -> type of files handled by this handler
            //   jump: function( $content, position ), -> set the currentime of the $content to position
            //   setStartTime: function( $content, event, onSuccess, onError ), -> set 0:00 on $content
            //   toJSON: function( $container ) -> convert content in $container to JSON
            // }
            handlers: [],
            // selectors of elements that 
            controls: { backward: [], forward: [] },
            // should return the url to upload a file named `filename` to, expected to end with '/'
            uploadUrl: false,
            // url string to which markers should be posted, expected to end with '/'
            markerUrl: false
        };


    function Plugin( element, options ) {
        this.xResize = 0;
        this.yResize = 0;
        this.oldEdge = false;
        this.$oldElement = false;
        this.element = element;
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this.pressedKeys = [];
        this.start = false;
        this.startX = 0;
        this.startY = 0;
        this.$helper = false;
        this.speed = 100; // in ms
        this.position = 0; // in ms
        this.markers = [];

        this.init();
    }


    Plugin.prototype = {


        init: function() {
            var self = this
              , $start = $( '#control-start' )
              , $marker = $( '#control-marker' )
              , $toggleMarker = $( '#control-toggle-marker-dropdown' )
              , $dropdown = $( '#control-marker-dropdown' );

            $( window ).keydown( function( event ) {
                switch ( event.which ) {
                    case 68: // d-key pressed
                        if ( !self.isInSet( self.pressedKeys, 'd' ) ) {
                            self.addToSet( self.pressedKeys, 'd' );
                        }
                        break;
                    case 48: // 0-key pressed
                        if ( !self.isInSet( self.pressedKeys, '0' ) ) {
                            self.addToSet( self.pressedKeys, '0' );
                            $start.removeClass( 'disabled' );
                            $( 'body' ).css( 'cursor', 'crosshair !important' );
                        }
                        break;
                    case 77: // m-key pressed
                        if ( !self.isInSet( self.pressedKeys, 'm' ) ) {
                            self.addToSet( self.pressedKeys, 'm' );
                            $marker.removeClass( 'disabled' );
                        }
                        break;
                    case 37: // arrow left pressed
                        self.moveBackward();
                        break;
                    case 38: // arrow up pressed
                        self.increaseStepwidth();
                        break;
                    case 39: // arrow right pressed
                        self.moveForward();
                        break;
                    case 40: // arrow down pressed
                        self.decreaseStepwidth();
                        break;
                }
            }).keyup( function( event ) {
                switch ( event.which) {
                    case 68: // d-key released
                        self.removeFromSet( self.pressedKeys, 'd' );
                        break;
                    case 48: // 0-key released
                        self.removeFromSet( self.pressedKeys, '0' );
                        $start.addClass( 'disabled' );
                        $( 'body' ).css( 'cursor', 'auto' );
                        break;
                    case 77: // m-key released
                        self.removeFromSet( self.pressedKeys, 'm' );
                        $marker.addClass( 'disabled' );
                        break;
                }
            }).mousedown( function( event ) {
                if ( event.which == 1 ) { // left button pressed
                    self.start = self.nearBorder( event.pageX, event.pageY );
                    self.startX = event.pageX;
                    self.startY = event.pageY;
                }
            }).mouseup( function( event ) {
                if ( event.which == 1 ) { // left button released
                    self.start = false;
                    self.move();
                }
            }).mousemove( function( event ) {
                var border = self.nearBorder( event.pageX, event.pageY )
                  , type = border.border;

                if ( type ) {
                    if ( !border.isOuterBorder) {
                        if ( self.isHorizontalBorder( type ) ) {
                            self.$element.css( 'cursor', 'e-resize' );
                        } else if (self.isVerticalBorder(type)) {
                            self.$element.css( 'cursor', 'n-resize' );
                        }
                    }
                } else {
                    self.$element.css( 'cursor', 'auto' );
                }

                if ( self.start.border ) {
                    var x = event.pageX - self.startX
                      , width = ( self.start.isOuterBorder ) ? self.$element.width() : self.start.element.width()
                      , percentX = 100 * x / width
                      , y = event.pageY - self.startY
                      , height = ( self.start.isOuterBorder ) ? self.$element.width() : self.start.element.width()
                      , percentY = 100 * y / height;

                    self.resize( self.start.element, x, y, self.start );

                    self.start = self.nearBorder(event.pageX, event.pageY);
                    self.startX = event.pageX;
                    self.startY = event.pageY;
                }
            });

            self.$element.click( function( event ) {
                var timestamp, markerX, markerY, $container, containerOffsetTop, containerOffsetLeft, zIndex, $markerImage;

                if( self.isInSet( self.pressedKeys, 'm' ) ) {
                    self.setMarker( self.isOver( {
                        x: event.pageX,
                        y: event.pageY
                    } ), event );
                } else if ( self.isInSet( self.pressedKeys, 'd' ) ) {
                    self.removeElement( self.isOver( { 
                        x: event.pageX, 
                        y: event.pageY 
                    } ) );
                } else if ( self.isInSet( self.pressedKeys, '0' ) ) {
                    self.setStartTime( self.isOver( { 
                        x: event.pageX, 
                        y: event.pageY 
                    } ), event );
                }
            });

            self.$element.get( 0 ).addEventListener( 'dragenter', function dragEnter( event ) { 
                self.onDragEnter( event, self );
            }, false );

            self.$element.get( 0 ).addEventListener( 'dragleave', function dragLeave( event ) {
                self.onDragLeave( event, self );
            } , false);

            self.$element.get( 0 ).addEventListener( 'dragover', function dragOver( event ) {
                self.onDragOver( event, self );
            }, false);

            self.$element.get( 0 ).addEventListener( 'drop', function drop( event ) {
                self.onDrop( event, self );
            }, false);

            self.$helper = $('<div id="helper-container"/>')
                .appendTo( self.$element )
                .hide()
                .css({
                    top: 0,
                    left: 0,
                    height: 150,
                    width: 300
                });

            $( '#control-speed' ).val( 100 ).change( function() {
                self.setStepwidth( parseInt( $( this ).val() ) || 100 );
            } );
            $( '#control-backward' ).click( function() { 
                self.moveBackward(); 
            } );
            $( '#control-forward' ).click( function() {
                self.moveForward(); 
            } );
            $toggleMarker.click( function() {
                $dropdown.toggleClass( 'visible' );
            } );
            $marker.click( function() {
                if ( self.isInSet( self.pressedKeys, 'm' ) ) {
                    self.removeFromSet( self.pressedKeys, 'm' );
                    $marker.addClass( 'disabled' );
                } else {
                    self.addToSet( self.pressedKeys, 'm' );
                    $marker.removeClass( 'disabled' );
                }
            } );
            $start.click( function() {
                if ( self.isInSet( self.pressedKeys, '0' ) ) {
                    self.removeFromSet( self.pressedKeys, '0' );
                    $start.addClass( 'disabled' );
                    $( 'body' ).css( 'cursor', 'auto' );
                } else {
                    self.addToSet( self.pressedKeys, '0' );
                    $start.removeClass( 'disabled' );
                    $( 'body' ).css( 'cursor', 'crosshair !important' );
                }
            } );
            $( '#control-sync' ).click( function() {
                var $this = $( this );

                if ( $this.is( '.disabled' ) ) {
                    $( '.container.dropzone' ).addClass( 'synced' );
                } else {
                    $( '.container' ).removeClass( 'synced' );
                }
                $this.toggleClass( 'disabled' );
            } );

            $.get( self.options.structureUrl ).done( function( structure ) {
                self.setupStructure( structure, self.$element );
            } );
            $.get( self.options.markerUrl ).done( function( markers ) {
                var marker;

                console.log( markers );

                for ( var i in markers ) {
                    marker = markers[ i ];
                    self.addToSet( self.markers, marker );
                    self.addToMarkerDropdown( marker );
                }
            } );
        },


        /**
         * Sets up the structure of the `$container` as described in
         * `structure`. Once this is done, `next` is called.
         *
         * The structure of every container is the same:
         *
         *     <div class="container" style="
         *         position: absolute;
         *         top: `structure.top`;
         *         left: `structure.left`;
         *         width: `structure.width`;
         *         height: `structure.height`;
         *         z-index: `structure[ 'z-index' ]`;">
         *             <div class="icon sync" style="z-index: `structure[ 'z-index' ] + 1`"></div>
         *             <div class="icon crosshair" style="z-index: `structure[ 'z-index' ] + 1`"></div>
         *             <div class="content"></div>
         *     </div>
         *
         * Hereby, `$( '.icon .sync' )` and `$( '.icon .crosshair' )` are
         * set up by `self.setupContainer( $( '.container' ) )`.
         *
         * @param structure
         *        the structure to set up in the container,
         *        see `self.structurize` for details
         * @param $container
         *        the container to be set up with structure.
         */
        setupStructure: function( structure, $container ) {
            var self = this
              , $content
              , child
              , handler
              , filename;

            $container.css( {
                'height': structure.height,
                'width': structure.width,
                'top': structure.top,
                'left': structure.left,
                'z-index': structure[ 'z-index' ]
            } ).attr( 'class', structure.classList );
            self.setupContainer( $container );

            if ( !structure.children ) {
                $container.addClass( 'dropzone' );
                if ( !structure.file ) {
                } else {
                    filename = structure.file.substring( structure.file.lastIndexOf( '/' ) + 1 );
                    handler = self.getHandlerForFilename( filename );
                    handler.render( 
                        $( '<div/>' )
                            .addClass( 'content' )
                            .addClass( handler.iam )
                            .attr( 'data-url', structure.file )
                            .appendTo( $container ),
                        structure.file,
                        filename
                    );
                }
            } else {
                for ( var i = 0; i < structure.children.length; i++ ) {
                    child = structure.children[ i ];
                    self.setupStructure( child, $( '<div/>' ).addClass( 'container' ).css( 'position', 'absolute' ).appendTo( $container ) );
                }
            }
        },


        /**
         * Treats the array `set` like a set (with unique entries).
         * Checks, if `element` is in the set.
         *
         * @param set
         *        the array the `element` should be found in
         * @param element
         *        the element that should be found in `set`
         */
        isInSet: function( set, element ) {
            return set.indexOf( element ) > -1;
        },


        /**
         * Adds `element` to the array `set` if it is not already 
         * in it.
         *
         * @param set
         *        the set the `element` should be added to
         * @param element
         *        the element that should be added to the `set`
         */
        addToSet: function( set, element ) {
            var self = this;

            if ( !self.isInSet( set, element ) ) {
                set.push( element );
            }
        },


        /**
         * Removes all occurances of `element` from `set`.
         *
         * @param set
         *        the array that contains occurances of `element`
         * @param element
         *        the element that should be totally removed from
         *        `set`
         */
        removeFromSet: function( set, element ) {
            var self = this;

            while ( self.isInSet( set, element ) ) {
                set.splice( set.indexOf( element ), 1 );
            }
        },


        setMarker: function( $container, event ) {
            var self = this
              , $content = $container.children( '.content' )
              , marker = {
                    x: event.offsetX, // TODO fix this!
                    y: event.offsetY,
                    color: self.nextMarkerColor()
                }
              , $marker;

            self.getHandler( $content ).setMarker( $content, marker, function onSuccess( time ) {
                $.extend( marker, { time: time } );

                self.markers[ marker.time ] = marker;
                self.addToMarkerDropdown( marker );

                $.post( self.options.markerUrl, marker ).done( function( result ) {
                    self.removeFromSet( self.pressedKeys, 'm' );
                    $( '#control-marker' ).addClass( 'disabled' );
                } );
            } );
        },


        /**
         * Adds `marker` to `#control-marker-dropdown` right
         * before the first dropdown element that has a higher
         * timestamp than the marker.
         *
         *     #control-marker-dropdown
         *     // => [0] 00.000
         *     // => [1] 02.000
         *     self.addToMarkerDropdown( { time: 500, ... } )
         *     #control-marker-dropdown
         *     // => [0] 00.000
         *     // => [1] 00.500
         *     // => [2] 02.000
         *
         * @param marker
         *        The marker to be added and rendered in the
         *        marker dropdown. Must contain a `time` key
         *        with a value in milliseconds.
         */
        addToMarkerDropdown: function( marker ) {
            var self = this
              , $dropdown = $( '#control-marker-dropdown' )
              , $markers = $dropdown.children( 'li' )
              , $marker
              , $currentMarker;

            if ( $( '#marker_' + marker.time ).length > 0 ) {
                $( '#marker_' + marker.time ).css( 'background-color', marker.color );
            } else {
                $marker = $( '<li id="marker_' 
                    + marker.time
                    + '" style="background-color: '
                    + marker.color
                    + ';">'
                    + self.toMillisecondsTimeString( marker.time )
                    + '</li>' ).click( function() {
                        self.position = marker.time;
                        self.move();
                    } );

                for ( var i = 0; i < $markers.length; i++ ) {
                    $currentMarker = $( $markers[ i ] );

                    if ( marker.time < parseInt( $currentMarker.attr( 'id' ).substr( 7 ) ) ) {
                        $currentMarker.before( $marker );
                        break;
                    }
                }

                if ( $dropdown.has( $marker ).length === 0 ) {
                    $marker.appendTo( $dropdown );
                }
            }
        },


        nextMarkerColor: function() {
            return 'rgb(16, 16, 19)';
            // return 'rgb(' 
            //     + Math.round( Math.random() * 150 ) + ',' 
            //     + Math.round( Math.random() * 150 ) + ',' 
            //     + Math.round( Math.random() * 150 ) + ')';
        },


        setStartTime: function( $container, event ) {
            var self = this
              , $content = $container.children( '.content' );

            self.getHandler( $content ).setStartTime( $content, event, function onSuccess() {
                self.removeFromSet( self.pressedKeys, '0' )
                $( '#control-start' ).addClass( 'disabled' );
                $container.addClass( 'start-set' );
                $( 'body' ).css( 'cursor', 'auto' );
                self.move();
            }, function onError() {
                if ( self.isInSet( self.pressedKeys, '0' ) ) {
                    self.removeFromSet( self.pressedKeys, '0' );
                }
                self.move();
            } );
        },


        /**
         * Moves the global position forward by `self.speed`
         * milliseconds. Triggers the `self.move` to update
         * all handlers.
         */
        moveForward: function() {
            var self = this;

            self.updatePosition( self.speed );
            self.move();
        },


        /**
         * Moves the global position backward by `self.speed`
         * milliseconds. Triggers the `self.move` to update
         * all handlers.
         */
        moveBackward: function() {
            var self = this;

            self.updatePosition( -self.speed );
            self.move();
        },


        /**
         * Adds `delta` to the global position. Means: if `delta`
         * is negative, the position is moved backward. *Does not*
         * trigger  the `self.move` function.
         *
         * @param delta
         *        Positive or negative delta for the global position.
         */
        updatePosition: function( delta ) {
            var self = this;
            self.position = Math.max( self.position + delta, 0 );
        },


        /**
         * Moves the content of all synced containers to the
         * global position. Calls `handler.jump` to update all handlers.
         */
        move: function() {
            var self = this;

            $( '#control-currenttime' ).text( self.toMillisecondsTimeString( self.position ) );

            $( '.container.synced' ).each( function() {
                var $content = $( this ).children( '.content' );

                self.getHandler( $content ).jump( $content, self.position );
            } );
        },


        /**
         * Sets the internal stepwidth (the distance the global
         * time is increased when `self.moveForward()` is called)
         * to `stepwidth` milliseconds.
         *
         * *Does not* touch the global time when called.
         *
         *     self.speed
         *     // => 100
         *     self.position
         *     // => 100
         *     self.setStepwidth( 200 )
         *     self.position
         *     // => 100
         *     self.moveForward()
         *     self.position
         *     // => 300 
         *
         * @param stepwidth
         *        Milliseconds the global time should be de/increased by
         */
        setStepwidth: function( stepwidth ) {
            var self = this;
            self.speed = stepwidth;
            $( '#control-speed' ).val( self.speed );
        },


        /**
         * Increases the stepwidth by `by` milliseconds. If `by` is
         * left undefined, Math.round( `self.speed` * 0.1 ) milliseconds
         * is assumed.
         *
         * @param by
         *        the amount the stepwidth should be increased by;
         *        if left undefined, Math.round( `self.speed` * 0.1 )
         *        is used
         */
        increaseStepwidth: function( by ) {
            var self = this
              , amount = ( by ) ? by : Math.round( self.speed * 0.1 );

            self.setStepwidth( self.speed + amount );
        },


        /**
         * Decreases the stepwidth by `by` milliseconds. If `by` is
         * left undefined, Math.round( `self.speed` * 0.1 ) milliseconds
         * is assumed.
         *
         * @param by
         *        the amount the stepwidth should be decreased by;
         *        if left undefined, Math.round( `self.speed` + 0.1 )
         *        is used
         */
        decreaseStepwidth: function( by ) {
            var self = this
              , amount = ( by ) ? by : Math.round( self.speed * 0.1 );

            self.setStepwidth( self.speed - amount );
        },


        /**
         * formats a time in milliseconds to a timestring of
         * the format [hh:][mm:]ss.sss
         *
         *     toMillisecondsTimeString( 1 )
         *     // => "00.001"
         *     toMillisecondsTimeString( 1000 )
         *     // => "01.000"
         *     toMillisecondsTimeString( 60 * 1000 )
         *     // => "01:00.000"
         *     toMillisecondsTimeString( 2.34 * 60 * 60 * 1000 )
         *     // => "02:20:23:374"
         *
         *
         * @return the formatted timestring
         */
        toMillisecondsTimeString: function( timeInMilliseconds ) {
            var ms = timeInMilliseconds % 1000
              , t1 = ( timeInMilliseconds - ms ) / 1000
              , sec = t1 % 60
              , t2 = ( t1 - sec ) / 60
              , min = t2 % 60
              , hr = ( t2 - min ) / 60
              , result = '';

            if ( hr > 0 ) {
                result += ( hr < 10 ? '0' : '' ) + hr + ':';
            }
            if ( hr <= 0 && min > 0 || hr > 0 ) {
                result += ( min < 10 ? '0' : '' ) + min + ':';
            }
            result += ( sec < 10 ? '0' : '' ) + sec;
            result += '.' + ( Array(4).join('0') + ms ).substr( -3 );

            return result;
        },


        onDragEnter: function( event, self ) {
            self.$helper.show();
        },



        onDragLeave: function( event, self ) {
            // nothing to do here
        },


        /**
         * Handler for dragging over the main container.
         * Draws the `self.$helper` to the matching position.
         *
         * @param event
         *        The dragover event fired.
         * @param self
         *        The self object, delegated from the caller.
         */
        onDragOver: function( event, self ) {
            var middle = self.middle( event.clientX, event.clientY, 0, 0 )
              , $container = self.isOver( middle );

            self.consume( event );

            if ( $container ) {
                self.drawHelperBox( $container, self.splitDirection( $container, middle ) );
            } else {
                self.$helper.hide();
            }
        },


        /**
         * Stops the `event` from bubbling up.
         *
         * @param event
         *        The event to stop from bubbling.
         */
        consume: function( event ) {
            event.stopPropagation();
            event.preventDefault();
        },


        /**
         * Handler for the drop event. Called, when a file is dropped
         * on the main container.
         *
         * Selects the right handler for the file dropped, calls
         * his `handler.read` method to select the right type of
         * FileReader reading.
         *
         * Uploads the read file to `self.options.uploadUrl`, then
         * adds the new DOM elements and calls the handler to render it
         * inside the returned `.content`.
         *
         * @param event
         *        The drop event for this method. Should contain some
         *        `event.dataTransfer.files`.
         * @param self
         *        Delegate the `self` object from the called.
         */
        onDrop: function( event, self ) {
            var middle = self.middle(event.clientX, event.clientY, 0, 0)
              , files = event.dataTransfer.files;

            self.consume( event );
            self.$helper.hide();

            if ( typeof files != 'undefined' && files.length > 0 ) {
                for ( var i = 0; i < files.length; i++ ) {
                    var reader = new FileReader()
                      , file = files[ i ]
                      , handler = self.getHandlerForFilename( file.name );

                    reader.onerror = function( evt ) {
                        var message = '';

                        switch ( evt.target.error.code ) {
                            case 1:
                                message = 'File "' + file.name + '" not found.';
                                break;
                            case 2:
                                message = 'File "' + file.name + '" has changed on disk. Please retry.';
                                break;
                            case 3:
                                message = 'Upload of file "' + file.name + '" has been cancelled.';
                                break;
                            case 4:
                                message = 'File "' + file.name + '" can not be read.';
                                break;
                            case 5:
                                message = 'File "' + file.name + '" is too large to be uploaded by the browser.';
                                break;
                        }

                        console.warn( message );
                    };

                    reader.onloadend = function( evt ) {
                        var $over = self.isOver( middle )
                          , $newContainer
                          , d = new FormData();
                        d.append( 'file', evt.target.result );

                        // the file is uploaded as multipart/form-data
                        // using the most possible raw upload jQuery supports
                        $.ajax({
                            url: self.options.uploadUrl( file.name ),
                            data: d,
                            cache: false,
                            contentType: false,
                            processData: false,
                            type: 'POST',
                            success:  function( pathname ) {
                                $newContainer = self.splitContainer( $over, self.splitDirection( $over, middle ) );
                                handler.render( 
                                    $newContainer.addClass( handler.iam ).attr( 'data-url', pathname ), 
                                    pathname, 
                                    pathname.substring( pathname.lastIndexOf( '/' ) + 1 ) 
                                );
                                $( '#control-sync' ).addClass( 'disabled' );
                                self.persistStructure();
                            }
                        } ); 
                    };

                    handler.read( reader, file );
                }
            }
        },


        /**
         * Gets the first handler from the list of handlers
         * that matches `filename`.
         *
         *     self.getHandlerForFilename( 'foo.csv' )
         *     // => csvHandler
         *
         * @param filename
         *        the name of the file that should be handled
         */
        getHandlerForFilename: function( filename ) {
            var self = this
              , handler;

            for ( var i = 0; i < self.options.handlers.length; i++ ) {
                handler = self.options.handlers[ i ];
                if ( handler.when( filename ) )
                    return handler;
            }
        },


        /**
         * posts the structure of the containers below `$container`
         * to the url specified in `self.options.structureUrl`.
         * 
         * `self.structurize` is capable of handling an undefined
         * `$container`, see the documentation there for more information.
         *
         * @param $container
         *        the container thats children should be structurized and
         *        saved (the container itself will be structurized too)
         */
        persistStructure: function( $container ) {
            var self = this;

            $.post( self.options.structureUrl, self.structurize( $container ) ).done( function( result ) {
                console.log( result );
            } );
        },


        /**
         * recursively creates a json structure for all children of
         * `$container`. if `$container` is left undefined, the root
         * container `self.$element` is structurized.
         *
         * a typical call (for a container withoud children) looks like
         *
         *     self.structurize( $container )
         *     // => {
         *     //      width: '1440',
         *     //      height: '800',
         *     //      top: '400px',
         *     //      left: '0px',
         *     //      'z-index': 50
         *     //      file: 'random-400.csv'
         *     //      children: []
         *     //    }
         *
         * @param $container
         *        the container that should be structurized. if left
         *        undefined, the root container `self.$element` will
         *        be used
         */
        structurize: function( $container ) {
            var self = this
              , structure = {};

            if ( !$container ) {
                $container = self.$element;
            }

            structure.width = $container.get( 0 ).style.width;
            structure.height = $container.get( 0 ).style.height;
            structure.left = $container.css( 'left' );
            structure.top = $container.css( 'top' );
            structure.classList = $container.attr( 'class' ); 
            structure[ 'z-index' ] = parseInt( $container.css( 'z-index' ) );
            structure.file = $container.children( '.content' ).attr( 'data-url' );
            structure.children = [];

            $container.children( '.container' ).each( function() {
                structure.children.push( self.structurize( $(this) ) );
            } );

            return structure;
        },


        middle: function( x, y, height, width ) {
            return {
                x: x + width / 2,
                y: y + width / 2
            };
        },


        isOver: function( middle ) {
            var self = this
              , lowest = self.lowest( self.$element )
              , $element = false;

            $.each( self.flatten( lowest ), function( index, value ) {
                var $entry = $( value )
                  , top = $entry.offset().top
                  , left = $entry.offset().left
                  , height = $entry.height()
                  , width = $entry.width();

                if ( left <= middle.x && middle.x < left + width && top <= middle.y && middle.y < top + height) {
                    $element = $entry;
                }
            } );

            return $element;
        },


        lowest: function ( container ) {
            return $( '.dropzone' );
        },


        flatten: function ( array ) {
            var self = this
              , flat = [];

            for ( var index = 0, length = array.length; index < length; index++ ) {
                var type = Object.prototype.toString.call( array[ index ] ).split( ' ' ).pop().split( ']' ).shift().toLowerCase();
                if (type) {
                    flat = flat.concat(
                        /^(array|collection|arguments|object)$/.test(type) ?
                            self.flatten( array[ index ] ) :
                            array[ index ]
                    );
                }
            }

            return flat;
        },


        isOriginBorder: function( borderType ) {
            return borderType == 'top' || borderType == 'left';
        },


        isHorizontalBorder: function( borderType ) {
            return borderType == 'left' || borderType == 'right';
        },


        isVerticalBorder: function( borderType ) {
            return borderType == 'top' || borderType == 'bottom';
        },


        nearBorder: function( x, y ) {
            var self = this
              , element = false
              , border = false
              , isOuterBorder = false;

            $( '.dropzone ' ).each( function( index, value ) {
                var $entry = $( value )
                  , top = $entry.offset().top
                  , left = $entry.offset().left
                  , height = $entry.get( 0 ).clientHeight
                  , width = $entry.get( 0 ).clientWidth
                  , delta = self.options.resizeDistance;

                if ( top <= y && y < top + height && left <= x && x < left + width) {
                    element = $entry;

                    if ( x - left < delta ) {
                        border = 'left';
                        if ( x - self.$element.position().left < delta ) {
                            isOuterBorder = true;
                        }
                    } else if ( left + width - x < delta ) {
                        border = 'right';
                        if ( self.$element.position().left + self.$element.width() - x < delta ) {
                            isOuterBorder = true;
                        }
                    } else if ( y - top < delta ) {
                        border = 'top';
                        if ( y - self.$element.position().top < delta ) {
                            isOuterBorder = true;
                        }
                    } else if ( top + height - y < delta ) {
                        border = 'bottom';
                        if ( self.$element.position().top + self.$element.height() - y < delta ) {
                            isOuterBorder = true;
                        }
                    }
                }
            });

            return {
                element: element,
                border: border,
                isOuterBorder: isOuterBorder
            };
        },


        removeElement: function( $element ) {
            var self = this;

            if ( $element.get(0).id == self.$element.get(0).id ) {
                return self.removeFromMainElement( $element );
            } else {
                self.removeFromInnerElement( $element );
            }
        },


        removeFromMainElement: function( $element ) {
            var self = this;

            if ( self.$element.length > 0 ) {
                self.$element.children( '.content' ).remove();
                $element.removeClass( self.getClass( $element ) );
                return true;
            } else {
                console.warn( "one does not simply remove the main container!" );
                return false;
            }
        },


        getClass: function ( $element ) {
            return this.getHandler( $element ).iam;
        },


        getHandler: function( $element ) {
            var self = this
              , handler;

            for ( var i = 0; i < self.options.handlers.length; i++ ) {
                handler = self.options.handlers[ i ];
                if ( $element.hasClass( handler.iam ) ) {
                    return handler;
                }
            }

            return false;
        },


        removeFromInnerElement: function ( $element ) {
            var self = this
              , $other = $element.siblings( '.container' )
              , $parent = $element.parent().addClass( self.getClass( $other ) )
              , $content = $other.children( '.content' )
              , $children;

            if ( $content.length > 0 ) {
                $content.get( 0 ).id = $parent.get( 0 ).id + '_content';
                $parent.append( $content );
            } else {
                $children = $other.children();

                $parent.removeClass( 'horizontal vertical' );
                if ( $other.hasClass( 'vertical' ) ) {
                    $parent.addClass( 'vertical' );
                } else if ( $other.hasClass( 'horizontal' ) ) {
                    $parent.addClass( 'horizontal' );
                }

                $parent.append( $children );
            }

            $parent.addClass( 'bordered' );

            $element.remove();
            $other.remove();

            self.fixIDs( $parent );
        },


        fixIDs: function( $element ) {
            var self = this
              , $children = $element.children( 'div' ).not( '.content, #helper-container, .container' );

            if ( $children.length == 2 ) {
                $.map( $children, function( index, value ) {
                    this.attr('id', $element.attr( 'id' ) + '_' + index );
                } );
                $.each( $children, function( index, value ) {
                    self.fixIDs( this );
                } );
            } else {
                $element.children( '.content:eq(0)' ).attr( 'id', $element.attr( 'id' ) + '_content' );
            }
        },


        resize: function( $element, xSizeInPx, ySizeInPx, border ) {
            var self = this
              , $parent
              , percentageHeight
              , percentageWidth
              , height
              , width
              , $other = $element.siblings( '.container' )
              , otherHeight
              , otherWidth
              , oldHeight = $element[0].clientHeight
              , oldWidth = $element[0].clientWidth
              , oldTop = $element.css( 'top' )
              , oldLeft = $element.css( 'left' )
              , oldOtherHeight = $other[0].clientHeight
              , oldOtherWidth = $other[0].clientWidth
              , oldOtherTop = $other.css( 'top' )
              , oldOtherLeft = $other.css( 'left' );

            if ( border.isOuterBorder ) {
                return false;
            } else {

                $parent = $element.parent();
                percentageHeight = 100 * $element.height() / $parent.height();
                percentageWidth = 100 * $element.width() / $parent.width();

                if ( border.border == 'top' && self.getChildPosition( $element ) == 'bottom' ) {

                    height = percentageHeight - (100 * ySizeInPx) / $parent.height();
                    otherHeight = 100 - height;

                    $element.height( height + '%' )
                        .css( 'top', otherHeight + '%');
                    $other.height( otherHeight + '%' )
                        .css( 'top', 0 + '%' );

                    if(! self.checkMinSize()) {
                        $element.height( oldHeight )
                            .css( 'top',  oldOtherHeight);
                        $other.height ( oldOtherHeight )
                            .css( 'top', 0 + '%' );
                    }

                    return true;
                } else if ( border.border == 'bottom' && self.getChildPosition( $element ) == 'top' ) {
                    height = percentageHeight + (100 * ySizeInPx) / $parent.height();
                    otherHeight = 100 - height;

                    $element.height( height + '%' )
                        .css( 'top', 0 + '%' );
                    $other.height( otherHeight + '%' )
                        .css( 'top', height + '%' );

                    if(! self.checkMinSize()) {
                        $element.height( oldHeight )
                            .css( 'top', 0 + '%' );
                        $other.height( oldOtherHeight )
                            .css( 'top', oldHeight );
                    }

                    return true;
                } else if ( border.border == 'left' && self.getChildPosition( $element ) == 'right' ) {

                    width = percentageWidth - (100 * xSizeInPx) / $parent.width();
                    otherWidth = 100 - width;

                    $element.width( width + '%' )
                        .css( 'left', otherWidth + '%' );
                    $other.width ( otherWidth + '%' )
                        .css( 'left', 0 + '%' );

                    if(! self.checkMinSize()) {
                        $element.width( oldWidth )
                            .css( 'left', oldOtherWidth );
                        $other.width ( oldOtherWidth )
                            .css( 'left', 0 + '%' );
                    }

                    return true;
                } else if ( border.border == 'right' && self.getChildPosition( $element ) == 'left' ) {

                    width = percentageWidth + (100 * xSizeInPx) / $parent.width();
                    otherWidth = 100 - width;

                    
                    $element.width( width + '%' )
                        .css( 'left', 0 + '%' );
                    $other.width( otherWidth + '%' )
                        .css( 'left', width + '%' );

                    if(! self.checkMinSize()) {
                        $element.width( oldWidth )
                            .css( 'left', 0 + '%' );
                        $other.width( oldOtherWidth )
                            .css( 'left', oldWidth );
                    }

                    return true;
                } else {
                    self.resize($parent, xSizeInPx, ySizeInPx, border);
                }
            }
        },

        checkMinSize: function () {
            var self = this,
                lowest = self.lowest();

            for(var i = 0; i < lowest.length; i++) {
                var $el = $(lowest[i]),
                height = $el[0].clientHeight,
                width = $el[0].clientWidth;

                if(height < self.options.minHeight || width < self.options.minWidth)
                    return false;
            }

            return true;
        },


        getChildPosition: function( $element ) {
            var self = this
              , position = false
              , $parent = $element.parent()
              , $other = $element.siblings( '.container' );

            if ( $parent.hasClass( 'horizontal' ) ) {
                if ( parseInt( $element.css( 'left' ) ) !== 0 ) {
                    position = 'right';
                }
                if ( parseInt( $other.css( 'left' ) ) !== 0 ) {
                    position = 'left';
                }
            } else if ( $parent.hasClass( 'vertical' ) ) {
                if ( parseInt( $element.css( 'top' ) ) !== 0 ) {
                    position = 'bottom';
                }
                if ( parseInt( $other.css( 'top' ) ) !== 0 ) {
                    position = 'top';
                }
            }

            return position;
        },

        /*
         * Computes the quarter of $container the point
         * middle = { x: pixels, y: pixels } lies in.
         *
         * `$container` is therefore virtually split by lines
         * that connect its four corners (it's an x, not a +)
         * and every quarter is assigned one of these four
         * split elements.
         *
         * @param $container
         *        The container that something is moved over
         *        at the position `middle`
         * @param middle
         *        The exact position something is moved over
         *        the `$container`. Must be relative to the
         *        container.
         */
        splitDirection: function( $container, middle ) {
            var self = this
              , m1 = $container.height() / $container.width()
              , b1 = 0
              , m2 = -m1
              , b2 = $container.height()
              , f1
              , f2;

            middle.x -= $container.offset().left;
            middle.y -= $container.offset().top;

            f1 = m1 * middle.x + b1;
            f2 = m2 * middle.x + b2;

            if (middle.y > f1) {
                if (middle.y > f2) {
                    return 'bottom';
                } else {
                    return 'left';
                }
            } else {
                if (middle.y > f2) {
                    return 'right';
                } else {
                    return 'top';
                }
            }
        },

        drawHelperBox: function( $element, edge ) {
            var self = this;

            if( ! ( $element.is(self.$oldElement) && edge == self.oldEdge ) ) {
                self.$oldElement = $element;
                self.oldEdge = edge;

                if ( $element.is( self.$element ) && $element.children('.content, .container').length === 0 ) {
                    self.$helper.width( $element.width() )
                        .height( $element.height() )
                        .css({
                            left: $element.offset().left,
                            top: 0
                        });
                } else {
                    if ( self.isVerticalBorder( edge ) ) {
                        self.$helper.width( $element.width() )
                            .height( $element.height() / 2 )
                            .css( {
                                left: $element.offset().left,
                                top: $element.offset().top - self.$element.offset().top + (( edge == 'bottom' ) ? $element.height() / 2 : 0 )
                            } );
                    } else if ( self.isHorizontalBorder( edge ) ) {
                        self.$helper.width( $element.width() / 2 )
                            .height( $element.height() )
                            .css( {
                                left: $element.offset().left + (( edge == 'right' ) ? $element.width() / 2 : 0 ),
                                top: $element.offset().top - self.$element.offset().top
                            } );
                    }
                }
                self.$helper.show();
            }
        },


        /**
         * Splits the `$container` after content is put at the `edge` of
         * the container. Two containers are put into `$container`, the 
         * `.content` of the container is always put into the first child.
         * Depending on the `edge`, the containers are swapped using css
         * offsets. The `$( '.content' )` of the second container is returned.
         *
         * @param $container
         *        The container that should be split into two
         * @param edge
         *        The edge the content is dropped in. See `self.splitDirection`
         *        for details on the edge.
         */
        splitContainer: function( $container, edge ) {
            var self = this
              , top1 = ( edge == 'bottom' ) ? '50%' : 0
              , top2 = ( edge == 'top' ) ? '50%' : 0
              , left1 = ( edge == 'right' ) ? '50%' : 0
              , left2 = ( edge == 'left' ) ? '50%' : 0
              , width = ( self.isHorizontalBorder( edge ) ) ? '50%' : '100%'
              , height = ( self.isVerticalBorder( edge ) ) ? '50%' : '100%'
              , index = parseInt( $container.css( 'z-index' ), 10 ) + 1
              , $child1 = self.newContainer( top1, left1, height, width, index )
              , $child2 = self.newContainer( top2, left2, height, width, index ).addClass( ( $container.is( '.synced' ) ? 'synced' : '' ) )
              , splitDirection = ( self.isHorizontalBorder( edge ) ) ? 'horizontal' : 'vertical'
              , $newContent = $( '<div class="content"/>' )
              , $containerContent = $container.children( '.content' );

            if ( $container.children( '.content' ).length > 0 ) {
                if ( self.isHorizontalBorder( edge ) && $container.width() / 2 < self.options.minWidth ) {
                    console.warn( 'minimum window width reached' );
                    return false;
                } else if ( self.isVerticalBorder( edge ) && $container.height() / 2 < self.options.minHeight ) {
                    console.warn( 'minimum window height reached' );
                    return false;
                }

                $container.remove( '.content' );

                $container.removeClass( 'bordered dropzone synced' )
                    .addClass( splitDirection )
                    .append( $child1.append( $newContent ).addClass( 'dropzone ') )
                    .append( $child2.append( $containerContent ).addClass( 'dropzone ') );

                self.$element.removeClass( 'dropzone' );
                $child1.addClass( 'dropzone' ).disableSelection();
                $child2.addClass( 'dropzone' ).disableSelection();
            } else {
                $container.append( $newContent );
            }

            self.$helper.hide();
            return $newContent;
        },


        /**
         * creates a new container with the attributes specified
         * and calls `self.setupContainer` on it.
         *
         * @param top
         *        the offset to the top the new container should have
         * @param left
         *        the offset to the left the new container should have
         * @param height
         *        the height the new container should have
         * @param width
         *        the width the new container should have
         * @param zIndex
         *        the zIndex the new container should have
         * @param classes
         *        the classes that should be added to the new container
         */
        newContainer: function( top, left, height, width, zIndex, classes ) {
            var self = this,
                $container = $( '<div class="container"/>' ).css( {
                    position: 'absolute',
                    top: top,
                    left: left,
                    height: height,
                    width: width,
                    'z-index': zIndex
                } ).addClass( classes );

            self.setupContainer( $container );

            return $container;
        },


        /**
         * sets up the `$container` with the `.sync` and `.start-set`
         * buttons in the top right of the container.
         *
         * @param $container
         *        the container to be set up. will contain two more
         *        divs, one `.sync`, one `.start-set`.
         */
        setupContainer: function( $container ) {
            var self = this
              , zIndex = parseInt( $container.css( 'z-index' ) ) + 1;

            $( '<div class="icon sync"/>')
                .css( 'z-index', zIndex )
                .appendTo( $container.disableSelection() )
                .click( function() {
                    $container.toggleClass( 'synced' );
                    if ( $( '.dropzone:not( .synced )' ).length == 0 ) {
                        $( '#control-sync' ).removeClass( 'disabled ');
                    } else {
                        $( '#control-sync' ).addClass( 'disabled' );
                    }
                    self.move();
                } );

            $( '<div class="icon crosshair"/>')
                .css( 'z-index', zIndex )
                .appendTo( $container )
                .click( function() {
                    if ( $container.is( '.start-set' ) ) {
                        $container.removeClass( 'start-set' );
                        $( 'body' ).css( 'cursor', 'auto' );
                        self.setStartTime( $container, false );
                    } 
                } );
        },
    };


    /**
     * binds the windowed-functionality to jQuery
     * 
     * @param options
     *        the options the plugin should be initialized with
     */
    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };


})( jQuery, window, document );