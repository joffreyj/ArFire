    /**
     * Base widget for all tool windows. Behave like the floating title pane with hide feature.
     * @class
     * @extends dojox/layout/FloatingPane
     * @features
     * 	 1. minimize to hide content area.
     *   2. click close button to hide instead of destroy.
     *   3. change the default close, minimize and restore icons.
     *   4. fixed the buggy resize function.
     */
    define([
    	"dojo/_base/declare",
    	"dojo/_base/lang",
    	"dojo/dom-construct",
    	"dojo/dom-geometry",
    	"dojo/dnd/move",
    	"dojo/on",
    	"dojox/layout/FloatingPane"
    ], function(declare, lang, domConstruct, domGeom, dndMove, on, FloatingPane){
    	
    	return declare(FloatingPane, {
    		resize: function(/* Object */dim){
    			// override: do nothing if passing no dim.
    			if (!dim) return;
    			
    			// summary:
    			//		Size the FloatingPane and place accordingly
    			dim = dim || this._naturalState;
    			this._currentState = dim;
    			
    			// Variables used for the issue corrections

    			// calculate the offset due to the border width
    			// borderOffset = borderWidth * 2
    			// @see http://www.w3schools.com/jsref/dom_obj_all.asp
    			var borderOffset = this.domNode.offsetWidth - this.domNode.clientWidth;

    			// get offsetParent node and its location values
    			var offsetParent = this.domNode.offsetParent;
    			var offsetLocation = {x: 0, y: 0};
    			if (offsetParent) {
    				var offsetParentLoc = domGeom.position(offsetParent);
    				offsetLocation = {x: offsetParentLoc.x, y: offsetParentLoc.y};
    			}

    			// From the ResizeHandle we only get width and height information
    			var dns = this.domNode.style;
    			if("t" in dim){ dns.top = dim.t + "px"; }
    			else if("y" in dim){ dns.top = (dim.y - offsetLocation.y) + "px"; }		// correction of issue #1. 
    			if("l" in dim){ dns.left = dim.l + "px"; }
    			else if("x" in dim){ dns.left = (dim.x - offsetLocation.x) + "px"; }	// correction of issue #1.
    			dns.width = (dim.w - borderOffset) + "px";		// correction of issue #2
    			dns.height = (dim.h - borderOffset) + "px";		// correction of issue #2

    			// Now resize canvas
    			var mbCanvas = { l: 0, t: 0, w: (dim.w - borderOffset), h: (dim.h - this.focusNode.offsetHeight - borderOffset) };
    			domGeom.setMarginBox(this.canvas, mbCanvas);

    			// If the single child can resize, forward resize event to it so it can
    			// fit itself properly into the content area
    			this._checkIfSingleChild();
    			if(this._singleChild && this._singleChild.resize){
    				this._singleChild.resize(mbCanvas);
    			}
    		},

    		// override
    		// Called when clicking the close button (X) located on the right side of the title bar.
    		// The original implementation is to destroy the widget. It should hide instead.
    		close: function() {
    			this.hide();
    		},
    		
    		// override
    		// Enable the user to create custom onHide event handler
    		hide: function() {
    			this.inherited(arguments);
    			this.onHide();
    		},
    		
    		// event added
    		onHide: function() {
    			// stub method for event
    		}
    	});
    });