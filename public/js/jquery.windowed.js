;

(function ($, window, document, undefined ) {
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
            // base uri to which files, expected to end with '/'
            uploadUrl: false
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

        this.init();
    }


    Plugin.prototype = {


        init: function() {
            var self = this
              , $start = $( '#control-start' );

            $( window ).keydown( function( event ) {
                switch ( event.which ) {
                    case 68: // d-key pressed
                        self.pressedKeys.push( 'd' ); 
                        break;
                    case 48: // 0-key pressed
                        self.pressedKeys.push( '0' );
                        $start.removeClass( 'disabled' );
                        $( 'body' ).css( 'cursor', 'crosshair !important' );
                        break;
                    case 37: // arrow left pressed
                        self.moveBackward();
                        break;
                    case 39: // arrow right pressed
                        self.moveForward();
                        break;
                }
            }).keyup( function( event ) {
                switch ( event.which) {
                    case 68: // d-key released
                        delete self.pressedKeys[ 'd' ]; 
                        break;
                    case 48: // 0-key released
                        delete self.pressedKeys[ '0' ];
                        $start.addClass( 'disabled' );
                        $( 'body' ).css( 'cursor', 'auto' );
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
                if ( 'd' in self.pressedKeys ) {
                    self.removeElement( self.isOver( { 
                        x: event.pageX, 
                        y: event.pageY 
                    } ) );
                } else if ( '0' in self.pressedKeys ) {
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

            self.setupContainer( self.$element );

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
                self.speed = parseInt( $( this ).val() ) || 100;
            } );
            $( '#control-backward' ).click( function() { 
                self.moveBackward(); 
            } );
            $( '#control-forward' ).click( function() {
                self.moveForward(); 
            } );
            $( '#control-start' ).click( function() {
                if ( '0' in self.pressedKeys ) {
                    self.pressedKeys.splice( self.pressedKeys.indexOf( '0' ), 1 )
                    $start.addClass( 'disabled' );
                    $( 'body' ).css( 'cursor', 'auto' );
                } else {
                    self.pressedKeys.push( '0' );
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
        },


        setStartTime: function( $container, event ) {
            var self = this
              , $content = $container.children( '.content' );

            console.log( 'setStartTime( ' + event.pageX + ' )' );

            self.getHandler( $content ).setStartTime( $content, event, function onSuccess() {
                self.pressedKeys.splice( self.pressedKeys.indexOf( '0' ), 1 )
                $( '#control-start' ).addClass( 'disabled' );
                $container.addClass( 'start-set' );
                $( 'body' ).css( 'cursor', 'auto' );
                self.move();
            }, function onError() {
                if ( '0' in self.pressedKeys ) {
                    self.pressedKeys.splice( self.pressedKeys.indexOf( '0' ), 1 );
                }
                self.move();
            } );
        },


        moveForward: function() {
            var self = this;

            self.updatePosition( self.speed );
            self.move();
        },


        moveBackward: function() {
            var self = this;

            self.updatePosition( -self.speed );
            self.move();
        },


        updatePosition: function( delta ) {
            var self = this;
            self.position = Math.max( self.position + delta, 0 );
        },


        move: function() {
            var self = this;

            $( '#control-currenttime' ).text( self.toMillisecondsTimeString( self.position ) );

            $( '.container.synced' ).each( function() {
                var $content = $( this ).children( '.content' );

                self.getHandler( $content ).jump( $content, self.position );
            } );
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


        consume: function( event ) {
            event.stopPropagation();
            event.preventDefault();
        },


        onDrop: function( event, self ) {
            var middle = self.middle(event.clientX, event.clientY, 0, 0)
              , files = event.dataTransfer.files;

            self.consume( event );

            if ( typeof files != 'undefined' && files.length > 0 ) {
                self.$helper.hide();

                for ( var i = 0; i < files.length; i++ ) {
                    var reader = new FileReader()
                      , file = files[ i ];

                    reader.onerror = function( evt ) {
                        switch ( evt.target.error.code ) {
                            case 1: console.warn('File "' + file.name + '" not found.'); break;
                            case 2: console.warn('File "' + file.name + '" has changed on disk. Please retry.'); break;
                            case 3: console.warn('Upload of file "' + file.name + '" has been cancelled.'); break;
                            case 4: console.warn('File "' + file.name + '" can not be read.'); break;
                            case 5: console.warn('File "' + file.name + '" is too large to be uploaded by the browser.'); break;
                        }
                    };

                    reader.onloadend = function( evt ) {
                        for ( var i = 0; i < self.options.handlers.length; i++ ) {
                            var handler = self.options.handlers[ i ]
                              , $over = self.isOver( middle )
                              , $newContainer;

                            if ( handler.when( file.name ) ) {
                                var rightHandler = handler;

                                $.post( self.options.uploadUrl( file.name ), { 
                                        data: evt.target.result, 
                                        type: handler.type( file ) 
                                    }, function( pathname ) {
                                        $newContainer = self.splitContainer( $over, self.splitDirection( $over, middle ) );
                                        rightHandler.render( 
                                            $newContainer.addClass( rightHandler.iam ), 
                                            pathname, 
                                            pathname.substring( pathname.lastIndexOf( '/' ) + 1 ) 
                                        );
                                    } ); 
                            }
                        }
                    };


                    for ( var i = 0; i < self.options.handlers.length; i++ ) {
                        var handler = self.options.handlers[ i ];

                        if ( handler.when( file.name ) ) {
                            handler.read( reader, file );
                        }
                    }
                }
            }
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

            $( '.dropzone ').each(function(index, value) {
                var $entry = $(value)
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
              , $other
              , otherHeight
              , otherWidth;

            if ( border.isOuterBorder ) {
                return false;
            } else {

                $parent = $element.parent();
                percentageHeight = 100 * $element.height() / $parent.height();
                percentageWidth = 100 * $element.width() / $parent.width();
                $other = $element.siblings( '.container' );

                if ( border.border == 'top' && self.getChildPosition( $element ) == 'bottom' ) {

                    height = percentageHeight - (100 * ySizeInPx) / $parent.height();
                    otherHeight = 100 - height;
                    
                    $element.height( height + '%' )
                        .css( 'top', otherHeight + '%');
                    $other.height( otherHeight + '%' )
                        .css( 'top', 0 + '%' );

                    return true;
                } else if ( border.border == 'bottom' && self.getChildPosition( $element ) == 'top' ) {
                    height = percentageHeight + (100 * ySizeInPx) / $parent.height();
                    otherHeight = 100 - height;

                    $element.height( height + '%' )
                        .css( 'top', 0 + '%' );
                    $other.height( otherHeight + '%' )
                        .css( 'top', height + '%' );

                    return true;
                } else if ( border.border == 'left' && self.getChildPosition( $element ) == 'right' ) {

                    width = percentageWidth - (100 * xSizeInPx) / $parent.width();
                    otherWidth = 100 - width;

                    $element.width( width + '%' )
                        .css( 'left', otherWidth + '%' );
                    $other.width ( otherWidth + '%' )
                        .css( 'left', 0 + '%' );

                    return true;
                } else if ( border.border == 'right' && self.getChildPosition( $element ) == 'left' ) {

                    width = percentageWidth + (100 * xSizeInPx) / $parent.width();
                    otherWidth = 100 - width;

                    $element.width( width + '%' )
                        .css( 'left', 0 + '%' );
                    $other.width( otherWidth + '%' )
                        .css( 'left', width + '%' );

                    return true;
                } else {
                    self.resize($parent, xSizeInPx, ySizeInPx, border);
                }
            }
        },


        getChildPosition: function( $element ) {
            var self = this
              , position = false
              , $parent = $element.parent()
              , $other = $element.siblings( '.container' );

            if ( $parent.hasClass( 'horizontal' ) ) {
                if ( $element.css( 'left' ) != '0px' ) {
                    position = 'right';
                }
                if ( $other.css( 'left' ) != '0px' ) {
                    position = 'left';
                }
            } else if ( $parent.hasClass( 'vertical' ) ) {
                if ( $element.css( 'top' ) != '0px' ) {
                    position = 'bottom';
                }
                if ( $other.css( 'top' ) != '0px' ) {
                    position = 'top';
                }
            }

            return position;
        },

        /*
         * computes the quarter of $container the point
         * middle = { x: pixels , y: pixels } 
         * lies in.
         *
         * $container is therefore virtually split by lines
         * that connect its four corners (it's an x, not a +)
         * and every quarter is assigned one of these four
         * split elements.
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


        splitContainer: function($container, edge, oldClasses, newClasses) {
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
                        self.setStartTime( $container, false );
                    }
                } );
        },


        // toJSON: function( $element ) {
        //     if ( !$element ) $element = this.$element;

        //     var self = this
        //       , $children = $element.children( '.content' )
        //       , cls = self.getClass( $children )
        //       , children = []
        //       , contentHandler = self.getHandler( $children );

        //     $element.children( '.content' ).each(function() {
        //         children.push( self.toJSON( $(this) ) );
        //     });
            
        //     return {
        //         classes: $element.attr( 'class' ),
        //         css: $element.attr( 'style' ),
        //         children: children,
        //         content: (( contentHandler ) ? contentHandler.toJSON( $element.children( '.content' ) ) : false )
        //     };
        // },


        // getHandlerForClass: function( classname ) {
        //     var self = this;

        //     for ( var i = 0; i < self.options.handlers.length; i++ ) {
        //         var handler = self.options.handlers[ i ];

        //         if ( handler.iam == classname ) {
        //             return handler;
        //         }
        //     }

        //     return false;
        // }
    };


    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };


})( jQuery, window, document );