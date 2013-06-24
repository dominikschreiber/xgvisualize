// DONE
// helper function to flatten an array
function flatten(array){
    var flat = [];
    for (var i = 0, l = array.length; i < l; i++){
        var type = Object.prototype.toString.call(array[i]).split(' ').pop().split(']').shift().toLowerCase();
        if (type) { flat = flat.concat(/^(array|collection|arguments|object)$/.test(type) ? flatten(array[i]) : array[i]); }
    }
    return flat;
}

// DONE
// helper function to compute the middle of an element
function middle(x, y, height, width) {
	return [x + height / 2, y + width / 2];
}

// DONE
// computes the child elements in the main container
// these are all none divided containers
function lowest(container) {
	var children = divChildren(container);

	if(children.length == 0 || children.length == 1) {
		return container;
	} else {
		return [lowest($(children[0])), lowest($(children[1]))];
	}
}

// DONE
// computes over wich of the non divided container
// in the main-container the dragged element is
function isOver(mid) {
	var l = lowest($("#main-container"));
	var flat = flatten(l);

	var ret = false;
	flat.forEach(function(entry) {
		var entry = $(entry);
    	var top = entry.offset().top;
    	var left = entry.offset().left;
    	var height = entry[0].clientHeight;
    	var width = entry[0].clientWidth;

    	
    	if(mid[0] > top && mid[0] < top + height && mid[1] > left && mid[1] < left + width) {
    		ret = entry;
    	}
	});
	return ret;
}

// DONE
// computes the position of all divs in the containers children
function divChildren(container) {
	var res = [];

	if(container) {
		var children = container.children();

		if(children.length == 0)
			return res;

		for(var i = 0; i < children.length; i++) {
			if(children[i].tagName == 'DIV' && ! $(children[i]).hasClass("content") && children[i].id != 'helper-container' && $(children[i]).hasClass('container')) {

	    		res.push(children[i]);
    		}
		}
	}

	return res;
}

function getContent(element) {
	var children = element.children();
	var ret;

	for(var i = 0; i < children.length; i++) {
		if($(children[i]).hasClass("content"))
			ret = children[i];
	}

	return ret;
}

// DONE
// gets the other child in the parent container of the given element
function getOtherChild(element) {
	var element = $(element);
	var parent = element.parent();
	var children = divChildren(parent);
	var other;
	if(children[0] == element[0])
		other = children[1];
	else
		other = children[0];

	other = $(other);
	return other;
}

// DONE
// returns wich of the plugins the given container should contain
function getClass(container) {
	if(container.hasClass('Video'))
		return 'Video';
	if(container.hasClass('Map'))
		return 'Map';
	if(container.hasClass('Chart'))
		return 'Chart';
	return;
}