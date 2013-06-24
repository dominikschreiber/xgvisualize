;
(function ($, window, document, undefined ) {
    var pluginName = "windowed",
        defaults = {
            // windows are only split if both new elements are higher than this value
            minHeight: 150,
            // windows are only split if both new elements are wider than this value
            minWidth: 150, 
            // the mouse pointer must be that much pixels from the border to trigger resizing
            resizeDistance: 10,
            // this is an array of objects of the form
            // {
            //   when: function( filetype ), -> if this condition holds
            //   thenRead: function( reader, file ), -> the reader should read the file that way
            //   thenDo: function( $container, file, body ) -> and it should be processed that way
            // }
            handlers: []
        };


    function Plugin( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options );
        this._defaults = defaults;
        this._name = pluginName;

        this.dPressed = false;
        this.start = false;
        this.startX = 0;
        this.startY = 0;
        this.$helper = false;

        this.init();
    }


    Plugin.prototype = {


        init: function() {
            var self = this;

            $( window ).keydown( function( event ) {
                if ( event.which == 68 ) { // d-key pressed
                    self.dPressed = true;
                }
            }).keyup( function( event ) {
                if ( event.which == 68 ) { // d-key released
                    self.dPressed = false;
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
                }
            }).mousemove( function( event ) {
                var border = self.nearBorder( event.pageX, event.pageY )
                  , type = border.border;

                if ( type ) {
                    if ( !border.isOuterBorder || !self.isOriginBorder( type ) ) {
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

                    self.resize(self.start.element, percentX, percentY, self.start);

                    self.start = self.nearBorder(event.pageX, event.pageY);
                    self.startX = event.pageX;
                    self.startY = event.pageY;
                }
            });

            self.$element.click( function( event ) {
                if ( self.dPressed ) {
                    self.removeElement( self.isOver( [ event.pageY, event.pageX ] ) );
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
        },


        onDragEnter: function( event, self ) {
            self.$helper.show();
        },



        onDragLeave: function( event, self ) {
            // nothing to do here
        },


        onDragOver: function( event, self ) {
            var middle = self.middle( event.x, event.y, 0, 0 )
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
            var middle = self.middle(event.x, event.y, 0, 0)
              , files = event.dataTransfer.files;

            self.consume( event );

            if ( typeof files != 'undefined' && files.length > 0 ) {
                self.$helper.hide();

                for ( var i = 0; i < files.length; i++ ) {
                    var reader = new FileReader()
                      , file = files[ i ];

                    reader.onerror = function( evt ) {
                        switch ( evt.target.error.code) {
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

                            if ( handler.when( file.type ) ) {
                                $newContainer = self.splitContainer( $over, self.splitDirection( $over, middle ) );
                                handler.thenDo( $newContainer.addClass( handler.iam ), file, evt.target.result );
                            }
                        }
                    };


                    for ( var j = 0; j < self.options.handlers.length; j++ ) {
                        var handler = self.options.handlers[ j ];

                        if ( handler.when( file.type ) ) {
                            handler.thenRead( reader, file );
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
            var self = this
              , $container = $( container )
              , $children = $container.children().not( '.content, #helper-container' );

            if ( $children.length < 2 ) {
                return $container;
            } else {
                return [ self.lowest( $children.get( 0 ) ), self.lowest( $children.get( 1 ) ) ];
            }
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
              , lowest = self.lowest( self.$element )
              , flat = self.flatten(lowest)
              , element = false
              , border = false
              , isOuterBorder = false;

            $.each(flat, function(index, value) {
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
                console.log( "one does not simply remove the main container!" );
                return false;
            }
        },


        getClass: function ( $element ) {
            var self =  this;

            for ( var i = 0; i < self.options.handlers; i++ ) {
                var cls = self.options.handlers[ i ].iam;

                if ( $element.hasClass( cls ) ) return cls;
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
                if ( self.isOriginBorder( border.border ) ) {
                    return false;
                } else if ( self.isVerticalBorder( border.border ) ) {
                    self.$element.width( self.$element.width() * ( 100 + xSizeInPx ) / 100 );
                } else if ( self.isHorizontalBorder( border.border ) ) {
                    self.$element.height( self.$element.height() * ( 100 + ySizeInPx ) / 100 );
                }
            } else {
                $parent = $element.parent();
                percentageHeight = 100 * $element.height() / $parent.height();
                percentageWidth = 100 * $element.width() / $parent.width();
                $other = $element.siblings( '.container' );

                if ( border.border == 'top' && self.getChildPosition( $element ) == 'bottom' ) {
                    height = percentageHeight * ( 100 - ySizeInPx ) / 100;
                    otherHeight = 100 - height;

                    $element.height( height + '%' );
                    $other.height( otherHeight + '%' )
                        .css( 'top', otherHeight + '%' );
                } else if ( border.border == 'bottom' && self.getChildPosition( $element ) == 'top' ) {
                    height = percentageHeight * ( 100 + ySizeInPx ) / 100;
                    otherHeight = 100 - height;

                    $element.height( height + '%' );
                    $other.height( otherHeight + '%' )
                        .css( 'top', height + '%' );
                } else if ( border.border == 'left' && self.getChildPosition( $element ) == 'right' ) {
                    width = percentageWidth * ( 100 - xSizeInPx ) / 100;
                    otherWidth = 100 - width;

                    $element.width( width + '%' );
                    $other.width ( otherWidth + '%' )
                        .css( 'left', otherWidth + '%' );
                } else if ( border.border == 'right' && self.getChildPosition( $element ) == 'left' ) {
                    width = percentageWidth * ( 100 + xSizeInPx ) / 100;
                    otherWidth = 100 - width;

                    $element.width( width + '%' );
                    $other.width( otherWidth + '%' )
                        .css( 'left', width + '%' );
                } else {
                    if ( $parent.hasClass( 'vertical' ) ) {
                        xSizeInPx *= $element.width() / 100;
                        xSizeInPx /= $parent.width() / 100;
                    } else if ($parent.hasClass( 'horizontal' ) ) {
                        ySizeInPx *= $element.height() / 100;
                        ySizeInPx /= $parent.height() / 100;
                    }
                    self.resize($parent, xSizeInPx, ySizeInPx, border);
                }
            }
        },


        getChildPosition: function( $element ) {
            var self = this
              , position = false
              , $parent = $element.parent()
              , $other = $element.siblings( '.container' );

            if ( $parent.hasClass( 'vertical' ) ) {
                if ( $element.css( 'left' ) != '0px' ) {
                    position = 'right';
                }
                if ( $other.css( 'left' ) != '0px' ) {
                    position = 'left';
                }
            } else if ( $parent.hasClass( 'horizontal' ) ) {
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
                            top: $element.offset().top - self.$element.offset().top + (( edge == 'bottom' ) ? $element.height() / 2 : 0)
                        } );
                } else if ( self.isHorizontalBorder( edge ) ) {
                    self.$helper.width( $element.width() / 2 )
                        .height( $element.height() )
                        .css( {
                            left: $element.offset().left + (( edge == 'right' ) ? $element.width() / 2 : 0),
                            top: $element.offset().top - self.$element.offset().top
                        } );
                }
            }
            self.$helper.show();
        },


        containsMediaElement: function( $element ) {
            return $element.children( '.content' ).length > 0;
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
              , $child1 = $( '<div class="container"/>' ).css( {
                    position: 'absolute',
                    top: top1,
                    left: left1,
                    height: height,
                    width: width,
                    'z-index': index
                } ).addClass( newClasses )
              , $child2 = $( '<div class="container"/>' ).css( {
                    position: 'absolute',
                    top: top2,
                    left: left2,
                    height: height,
                    width: width,
                    'z-index': index
                } ).addClass( newClasses )
              , splitDirection = ( self.isHorizontalBorder( edge ) ) ? 'horizontal' : 'vertical'
              , $newContent = $( '<div class="content"/>' )
              , $oldContent = $( '<div class="content"/>' )
              , $containerContent = $container.children( '.content' );

            if ( self.containsMediaElement( $container ) ) {
                if ( self.isHorizontalBorder( edge ) && $container.width() / 2 < self.options.minWidth ) {
                    console.log( 'minimum window width reached' );
                    return false;
                } else if ( self.isVerticalBorder( edge ) && $container.height() / 2 < self.options.minHeight ) {
                    console.log( 'minimum window height reached' );
                    return false;
                }

                $oldContent.empty().append($containerContent)
                    .addClass( $containerContent.attr('class') );
                $container.remove('.content');

                $container.removeClass( 'bordered' )
                    .addClass( splitDirection )
                    .append( $child1.append( $newContent ) )
                    .append( $child2.append( $oldContent ) );
            } else {
                $container.append( $newContent );
            }

            self.$helper.hide();
            return $newContent;
        }
    };


    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName, new Plugin( this, options ));
            }
        });
    };


})( jQuery, window, document );