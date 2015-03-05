// DONE
// config
var minHeight = 150
  , minWidth = 150
  , resizeDistance = 10
  // global variables
  , start = false
  , startX = 0
  , startY = 0
  , dPressed = false
  , $main
  , $helper;


// DONE
// register key listeners
$(window).keydown(function(evt) {
  if(evt.which == 68) { // D
    dPressed = true;
  }
}).keyup(function(evt) {
  if(evt.which == 68) { // D
    dPressed = false;
  }
});

// DONE
$(window).mousedown(function(e) {
	if(e.which == 1) { // left mouse button
		start = nearBorder(e.pageX, e.pageY);
		startX = e.pageX;
		startY = e.pageY;
	}
});

// DONE
$(window).mouseup(function(e) {
	start = false;
});

// DONE
$(window).mousemove(function(e) {
	var border = nearBorder(e.pageX, e.pageY);
	if(border.border) {
		if(! (border.isOuterBorder && (border.border == "top" || border.border == "left"))) {
			if(border.border == "left" || border.border == "right")
				$main.css("cursor", "e-resize");
			if(border.border == "top" || border.border == "bot")
				$main.css("cursor", "n-resize");
		}
	}
	 else {
			$main.css("cursor", "auto");
		}

	if (start.border) {
		var x = e.pageX - startX
		  , width = (start.isOuterBorder) ? $main.width() : start.element.width()
		  , percentX = x / (width / 100)
      , y = e.pageY - startY
		  , height = (start.isOuterBorder) ? $main.width() : start.element.height()
      , percentY = y / (height / 100);

		// do the resizeing
		resize(start.element, percentX, percentY, start);

		// set start to the current mouse position
		start = nearBorder(e.pageX, e.pageY);
		startX = e.pageX;
		startY = e.pageY;
	}
});


// initialize
$(document).ready(function() {
  // DONE
	$(document).click(function(e) {
		if(dPressed) {
			removeElement(isOver([e.pageY, e.pageX]));
		}
	});

  // DONE
  $main = $('#main-container');
  $helper = $("<div id=helper-container></div>")
		.appendTo($main)
		.hide()
		.css({
				'top': 0, 
				'left': 0, 
				'height': 150, 
				'width': 300
			});


  // TODO
	// make elements dragable
    $( "#draggables" ).find("li").each(function() {
      $(this).children().draggable({
        drag: function(event, ui) {
          var draggable = $(this).data("ui-draggable");
          var top = draggable.element.context.offsetTop;
          var left = draggable.element.context.offsetLeft;
          var height = draggable.element.context.clientHeight;
          var width = draggable.element.context.clientWidth;

          // x y vertauscht (ups)
          // middle of the dragged element
          var mid = middle(top, left, height, width);

          // compute over wich element the dragged element is
          var container = isOver(mid);

          if(container) {
          	// highlight how the container would split
          	drawHelperBox(container, splitDirection(container, mid));
          }
          else {
           	$("#helper-container").hide();
          }
        },
        revert: true
        });
    });

    // TODO
    // make the main container droppable
    // everything is dropped on the main container, 
    // so there is no need to make any subcontainers droppable
    $("#main-container").droppable({
    	drop: function(event, ui) {

    		// the dragged element
    		var draggable = event.toElement;

    		// properties of the dragged element
    		var top = draggable.offsetTop;
	    	var left = draggable.offsetLeft;
	  		var height = draggable.clientHeight;
	    	var width = draggable.clientWidth;

	  		// middle of the dragged element
    		var mid = middle(top, left, height, width);

    		// compute over wich element the dragged element is
    		var container = isOver(mid);

    		if(container) {
    			// split the container the element is dropped on
    			oldCls = getClass(container);
    			if(oldCls) {
   					splitContainer(container, splitDirection(container, mid), oldCls, draggable.innerHTML);
    			} else {
    				container.addClass(draggable.innerHTML);
    				container.append('<div id="' + container[0].id + '_content"></div>');
    				var content = $("#" + container[0].id + "_content");
    				content.addClass("content");
    				content.append('<img id="' + container[0].id + '_img" src="img/' + draggable.innerHTML + '.png"></img>');
					var img = $("#" + container[0].id + "_img");
    				img.css('height', '100%');
    				img.css('width', '100%');
    			}
    		}
    		$("#helper-container").hide();
    	}
    });
});

// DONE
function removeElement($element) {

	// special case: remove on the main container
	if($element[0].id == "main-container") {
		if($main.length > 0) {
			// if the main container has content, then remove it
			$("#main-container_content").remove();
			$element.removeClass(getClass($element));
			return true;
		} else { 
			// if the main container does not have content, then display a nerdy error message
			console.log("one does not simply remove the main container!");
			return false;
		}
	}

	// get the parent element of the element that is about to be deleted
	var $parent = $element.parent();
	// get the other element in the parent container
	var $other = getOtherChild($element);

	// copy the content of the other element to the parent element
	$parent.addClass(getClass($other)); // add the class of the other child
	var $content = $("#" + other[0].id + "_content");
	if($content.length > 0) {
		// the element is a leaf
		$content[0].id = $parent[0].id + "_content"; // note the id change so the structure stays consistent
		$parent.append($content[0]); // add the example content of the other child TODO: add real content
	} else {
		var $child1 = $("#" + other[0].id + "_1");
		var $child2 = $("#" + other[0].id + "_2");

		// remove the split class from the parent
		$parent.removeClass("horizontal vertical");

		// add the split class of the other container
		if($other.hasClass("vertical"))
			$parent.addClass("vertical");
		if($other.hasClass("horizontal"))
			$other.addClass("horizontal");

		$parent.append($child1[0]).append($child2[0]);
	}

	$parent.css('border', '1px solid black');

	// remove the two childs
	$element.remove();
	$other.remove();

	fixIDs($parent);
}

// DONE
// this function takes an element with a correct id and fixes the id of all of its child elements
function fixIDs(element) {
	var children = divChildren(element);
	if(children.length == 2) {
		var child1 = $(children[0]);
		var child2 = $(children[1]);

		child1[0].id = element[0].id + "_1";
		child2[0].id = element[0].id + "_2";

		fixIDs(child1);
		fixIDs(child2);
	} else {
		var content = getContent(element);
		content.id = element[0].id + "_content";
		return;
	}
}

// DONE
// resizes the given element at the given border by the pixelSize 
// (x or y required the other one gets dropped)
function resize(element, pixelSizeX, pixelSizeY, border) {

	// check if the main window has to be resized
	if(border.isOuterBorder)
		if(border.border == "left" || border.border == "top")
			return;

	if(border.isOuterBorder) {
		var main = $("#main-container");
		if(border.border == "top" || border.border == "bot") {
			// new height = current height * percent of enlargement
			var height = parseInt(main.css('height')) * ((100 + pixelSizeY) / 100);
			main.css('height', height);
		}
		if(border.border == "left" || border.border == "right") {
			var width = parseInt(main.css('width')) * ((100 + pixelSizeX) / 100);
			main.css('width', width);
		}
	} else {

		if(border.border == "top" && getChildPosition(element) == "bot") {
			// height = current percentage height + percentage enlargement
			var parentHeight = parseInt(element.parent().css('height'));
			var currentHeight = parseInt(element.css('height'));
			var percentageHeight = currentHeight / (parentHeight / 100);
			var height = percentageHeight * (100 - pixelSizeY) / 100;

			// set the new height
			element.css('height', height + "%");

			// set the new height of the second child in the container
			var other = getOtherChild(element);
			var otherHeight = 100 - height;

			other.css('height', otherHeight + "%");

			// set the new top value
			element.css('top', otherHeight + "%");

			return;
		}

		if(border.border == "bot" && getChildPosition(element) == "top") {
			pixelSizeY *= -1;

			// height = current percentage height + percentage enlargement
			var parentHeight = parseInt(element.parent().css('height'));
			var currentHeight = parseInt(element.css('height'));
			var percentageHeight = currentHeight / (parentHeight / 100);
			var height = percentageHeight * (100 - pixelSizeY) / 100;

			// set the new height
			element.css('height', height + "%");

			// set the new height of the second child in the container
			var other = getOtherChild(element);
			var otherHeight = 100 - height;

			other.css('height', otherHeight + "%");

			// set the new top value
			other.css('top', height + "%");

			return;
		}

		if(border.border == "left" && getChildPosition(element) == "right") {
			// width = current percentage width + percentage enlargement
			var parentWidth = parseInt(element.parent().css('width'));
			var currentWidth = parseInt(element.css('width'));
			var percentageWidth = currentWidth / (parentWidth / 100);
			var width = percentageWidth * (100 - pixelSizeX) / 100;

			// set the new height
			element.css('width', width + "%");

			// set the new height of the second child in the container
			var other = getOtherChild(element);
			var otherWidth = 100 - width;

			other.css('width', otherWidth + "%");

			// set the new left value
			element.css('left', otherWidth + "%");

			return;
		}

		if(border.border == "right" && getChildPosition(element) == "left") {
			pixelSizeX *= -1;

			// width = current percentage width + percentage enlargement
			var parentWidth = parseInt(element.parent().css('width'));
			var currentWidth = parseInt(element.css('width'));
			var percentageWidth = currentWidth / (parentWidth / 100);
			var width = percentageWidth * (100 - pixelSizeX) / 100;

			// set the new height
			element.css('width', width + "%");

			// set the new height of the second child in the container
			var other = getOtherChild(element);
			var otherWidth = 100 - width;

			other.css('width', otherWidth + "%");

			// set the new left value
			other.css('left', width + "%");

			return;
		}
		
		if(element.parent().hasClass("vertical")) {
			var parentWidth = parseInt(element.parent().css('width'));
			var currentWidth = parseInt(element.css('width'));
			pixelSizeX *= currentWidth / 100;
			pixelSizeX /= parentWidth / 100;
		}
		if(element.parent().hasClass("horizontal")) {
			var parentHeight = parseInt(element.parent().css('height'));
			var currentHeight = parseInt(element.css('height'));
			pixelSizeY *= currentHeight / 100;
			pixelSizeY /= parentHeight / 100;
		}

		resize(element.parent(), pixelSizeX, pixelSizeY, border);
	}
}

// DONE
// detects near wich border the mouse is and if this border is an outer border
// returns an object that consists of the element, that the mouse is over, the
// border, the mouse is close to and the outer border flag.
// if the mouse is not close to any border, the border will be false
// returns: {element, border, isOuterBorder}
function nearBorder(mouseX, mouseY) {
	// a list of all lowest children
	var l = lowest($("#main-container"));
	var flat = flatten(l);

	var element = false;
	var border = false;
	var isOuterBorder = false;

	// iterate over all children
	flat.forEach(function(entry) {
		// properties of the current child
		var entry = $(entry);
    	var top = entry.offset().top;
    	var left = entry.offset().left;
    	var height = entry[0].clientHeight;
    	var width = entry[0].clientWidth;
    	var main = $("#main-container");
    	
    	if(mouseY > top && mouseY < top + height && mouseX > left && mouseX < left + width) {
    		element = entry;
    		// if the mouse is over this child compute if it is near a border
    		if(mouseX - left < resizeDistance) {
    			if(mouseX - main.position().left < resizeDistance)
    				isOuterBorder = true;
    			border = "left";

    		}
    		if(left + width - mouseX < resizeDistance) {
    			if(main.position().left + main.width() - mouseX < resizeDistance)
    				isOuterBorder = true;
    			border = "right";
    		}
    		if(mouseY - top < resizeDistance) {
    			if(mouseY - main.position().top < resizeDistance)
    				isOuterBorder = true;
    			border = "top";
    		}
    		if(top + height - mouseY < resizeDistance) {
    			if(main.position().top + main.height() - mouseY < resizeDistance)
    				isOuterBorder = true;
    			border = "bot";
    		}
    	}
	});


	var ret = {
		element: element,
    	border: border,
    	isOuterBorder: isOuterBorder
    };

	return ret;
}

// DONE
function getChildPosition(element) {
	var ret;

	var element = $(element);
	var other = getOtherChild(element);

	if(element.parent().hasClass("vertical")) {
		if(element.css('left') != "0px")
			ret = "right";
		if(other.css('left') != "0px")
			ret = "left";
	}
	if(element.parent().hasClass("horizontal")) {
		if(element.css('top') != "0px")
			ret = "bot";
		if(other.css('top') != "0px")
			ret = "top";
	}
	return ret;
}

// DONE
// computes on wich side the dragged element 
// would be if it was dropped now
function splitDirection(container, middle) {
	// correct the point, so the top-left corner of the container is (0 / 0)
	middle[0] = middle[0] - container.offset().top;
	middle[1] = middle[1] - container.offset().left;

	// the return value
	var direction = 0;

	// line parameters
	var m1, m2, b1, b2;

	b1 = 0;
	b2 = container[0].clientHeight;

	m1 = container[0].clientHeight / container[0].clientWidth;
	m2 = -m1;

	var f1xp = m1 * middle[1] + b1;
	var f2xp = m2 * middle[1] + b2;

	if(middle[0] > f1xp) {
		// under f1
		if(middle[0] > f2xp) {
			// under f2
			direction = "bot";
		} else {
			// over f2
			direction = "left";
		}
	} else {
		// over f1
		if(middle[0] > f2xp) {
			// under f2
			direction = "right";
		} else {
			// over f2
			direction = "top";
		}
	}

	return direction;
}

// DONE
// draws the helper box to show the user where the new element will be dropped
function drawHelperBox(container, splitDirection) {
	console.log("drawing");
	if(container[0].id == "main-container" && !container.hasClass('Chart') && !container.hasClass('Map') && !container.hasClass('Video')) {
		$("#helper-container")
			.css('width', container[0].clientWidth)
			.css('height', container[0].clientHeight)
			.css('top', container.offset().top)
			.css('left', container.offset().left);
	} else {
		if(splitDirection == 0) {
			console.log("split direction computation failed");
		} else {
			if(splitDirection=="top" || splitDirection == "bot") {
				$("#helper-container").css('width', container[0].clientWidth).css('height', container[0].clientHeight / 2);
				if(splitDirection=="top") {
					$("#helper-container").css('top', container.offset().top).css('left', container.offset().left);
				}
				if(splitDirection=="bot") {
					$("#helper-container").css('top', container.offset().top + container[0].clientHeight / 2).css('left', container.offset().left);
				}
			}
			if(splitDirection=="left" || splitDirection == "right") {
				$("#helper-container").css('width', container[0].clientWidth / 2).css('height', container[0].clientHeight);
				if(splitDirection=="left") {
					$("#helper-container").css('top', container.offset().top).css('left', container.offset().left);
				}
				if(splitDirection=="right") {
					$("#helper-container").css('top', container.offset().top).css('left', container.offset().left + container[0].clientWidth / 2);
				}
			}
		}
	}
	console.log("lalala");
	$("#helper-container").show();
}

// DONE
// splits the container into 2 sub containers
function splitContainer(container, splitDirection, oldCls, newCls) {
	if(splitDirection == 0) {
		console.log("split direction computation failed");
	} else {

		var top1;
		var top2;
		var left1;
		var left2;
		var width;
		var height;
		var index;
		
		index = parseInt(container.css("z-index"));
		index++;

		id1 = container[0].id + "_1";
		id2 = container[0].id + "_2";

		// set the new containers position parameters
		if(splitDirection=="top" || splitDirection == "bot") {
			width = "100%";
			height = "50%";

			if(splitDirection=="top") {
				top1 = "0%";
				top2 = "50%";
				left1 = "0%";
				left2 = "0%";
			}
			if(splitDirection=="bot") {
				top1 = "50%";
				top2 = "0%";
				left1 = "0%";
				left2 = "0%";
			}
		}
		if(splitDirection=="left" || splitDirection == "right") {
			width = "50%";
			height = "100%";

			if(splitDirection=="left") {
				top1 = "0%";
				top2 = "0%";
				left1 = "0%";
				left2 = "50%";
			}
			if(splitDirection=="right") {
				top1 = "0%";
				top2 = "0%";
				left1 = "50%";
				left2 = "0%";
			}
		}

		// check if a split is possible
		var currentHeight = parseInt(container.css('height'));
		var currentWidth = parseInt(container.css('width'));

		if(splitDirection == "top" || splitDirection == "bot")
			if(currentHeight / 2 < minHeight) {
				console.log("minimum window height reached");
				return false;
			}
		if(splitDirection == "left" || splitDirection == "right")
			if(currentWidth / 2 < minWidth) {
				console.log("minimum window width reached");
				return false;
			}


    	container.removeClass(oldCls);
    	
		// append the new containers to the document
		container.append("<div id=" + id1 + " class='container'> </div>");

		container.append("<div id=" + id2 + " class='container'> </div>");

		// add the content of the parent container to the container2

		// define childrens css and classes
		var child1 = $("#"+ id1);
		var child2 = $("#"+ id2);

		var sDir;

		if(splitDirection == "top" || splitDirection == "bot")
			sDir = "horizontal";
		if(splitDirection.toString() == "left" || splitDirection.toString() == "right")
			sDir = "vertical";

		container.addClass(sDir);

		child1.css('position', 'absolute');
		child1.css('top', top1);
		child1.css('left', left1);
		child1.css('height', height);
		child1.css('width', width);
		child1.css('z-index', index);
		child1.addClass(newCls);

		child2.css('position', 'absolute');
		child2.css('top', top2);
		child2.css('left', left2);
		child2.css('height', height);
		child2.css('width', width);
		child2.css('z-index', index);
		child2.addClass(oldCls);


		// add a content box to the child containers, add an image box to each content container
		var content1 = $('<div id="' + child1[0].id + '_content"></div>');
		var content2 = $('<div id="' + child2[0].id + '_content"></div>');


		var img1 = $('<img id="' + content1[0].id + '_img" src="img/' + newCls + '.png"></img>');
		var img2 = $('<img id="' + content2[0].id + '_img" src="img/' + oldCls + '.png"></img>');

		child1.append(content1);
		content1.append(img1);

		child2.append(content2);
		content2.append(img2);

		content1.addClass("content");
		content2.addClass("content");

   		img1.css('height', '100%');
 		img1.css('width', '100%');

   		img2.css('height', '100%');
 		img2.css('width', '100%');

 		// make the parent containers border 0 so they dont stack with the childrens borders
		container.css('border', '0px solid black');

		// remove the parent containers content
		var content = $("#" + container[0].id + "_content");
		content.remove();

		$("#helper-container").hide();
	}
}
