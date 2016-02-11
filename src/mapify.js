(function ( $ ) {

	// default plugin settings
	var defaults = {
		hoverClass: "",
		popOver: false
	};
	
	// default plugin settings to be used when the popOver option is enabled
	var defaultsPopOver = { 
		hoverClass: "",
		popOver: {
			content: function(zone,imageMap){ 
				return "";
			},
			delay: 0.8,
			margin: "10px",
			width: "",
			height: ""
		}
	};
	
    var iOS = /(iPad|iPhone|iPod)/g.test( navigator.userAgent );
    
    // plugin declaration
    $.fn.mapify = function(settings) {
        
		// Merging passed parameters with the default one
        var settings = $.extend(true, {}, defaults, settings);
    
    	if( settings.popOver ){
			// Merging passed parameters with the popOverdefault options
        	var settings = $.extend(true, {}, defaultsPopOver, settings);
        	
			settings.popOver.margin = parseInt(settings.popOver.margin);
			settings.popOver.width = settings.popOver.width;
			
			var popOverTransition = "";
			var popOverArrowTransition = "";
			
			if( !isNaN(settings.popOver.delay) ){ // if is a number
				popOverTransition = "all "+settings.popOver.delay+"s";
				popOverArrowTransition = "margin "+settings.popOver.delay+"s";
			}
        	
        }
    
    	var imageMap = this;
    	
    	imageMap.each(function() {
    	
	    	var imageMap = this;
	    	var map = $(imageMap).attr("usemap");
		    var zones = $(map).find("area");
	    	
	    	if( !$(imageMap).hasClass("mapify") ){ // if the map has not already been "mapified"
	    	
	    		var popOverIsEnabled = false;
	    		if( settings.popOver ){ // Setting a flag telling if the popover is enabled for each map instance
		    		popOverIsEnabled = true;
	    		}
	    	
	    		$(imageMap).addClass("mapify");
	    		
	    		var mapWidth = parseInt($(imageMap).attr("width"));
		    	var mapHeight = parseInt($(imageMap).attr("height"));
		    	
		    	if( !$(imageMap).attr("width") || !$(imageMap).attr("height") ){
			    	alert("The width and height attributes must be specified on your image.");
			    	return "Not mapified";
		    	}
		    	
		    	$(imageMap).wrap(function() {
				  return '<div class="mapify-holder"></div>';
				});
				
				var mapHolder = $(imageMap).parent();
				
				// The map element must wrapped with the image, 
				// otherwise setting overflow:scroll|auto on an element containing the map would not work in webkit.
				$(map).appendTo(mapHolder);
				
				$(imageMap).before('<img class="mapify-img" src="'+$(imageMap).attr("src")+'" />');
				
				var fakeImageMap = $(imageMap).prev(".mapify-img");
				
				$(imageMap).before('<svg class="mapify-svg" width="'+mapWidth+'" height="'+mapHeight+'"></svg>');
				
				var mapSVG = $(imageMap).prev(".mapify-svg");
				
				zones.each(function(){
					$(this).attr("data-coords-default", $(this).attr('coords')); // store default pixel coordinates for later use
						   
					if( popOverIsEnabled ){
						$(this).removeAttr('alt')
						   .attr("data-title", $(this).attr('title'))
						   .removeAttr('title'); // Prevent that little anoying bubble from poping up when the popover is activated
					}	   
						   
					var coords = $(this).attr("coords").split(',');
								
						for (key in coords) { // convert the pixel coordinates to percentage
							if(key % 2 == 0){  // X
								coords[key] = coords[key]* 100/mapWidth;
							}else{ // Y
								coords[key] = coords[key]* 100/mapHeight;
							}
						}
						$(this).attr("data-coords", coords.toString()); // store the percentage coordinates for later use
						
						var polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
							polygon.className = "mapify-polygon";
							polygon.setAttribute("fill", "none");
						
					mapSVG.append(polygon);
				});
				
				$(imageMap).wrap(function() {
				  return '<div class="mapify-imgHolder"></div>';
				}).css("opacity",0);
				
				if( popOverIsEnabled ){
					$(imageMap).after('<div class="mapify-popOver" style=" transition:'+popOverTransition+'; "><div class="mapify-popOver-content"></div><div class="mapify-popOver-arrow" style=" transition:'+popOverArrowTransition+'; "></div></div>')
					var popOver = $(imageMap).next(".mapify-popOver");
					var popOverArrow = popOver.find(".mapify-popOver-arrow");
					
					popOver.css({width: settings.popOver.width,height: settings.popOver.height});
				}
				
				var hasScrolled = false;
				$(document).bind("touchend.mapify",function(e){
					if( !hasScrolled ){
						clearMap(popOver, mapSVG);
					}
					hasScrolled = false;
				}).bind("touchmove.mapify",function(e){
					hasScrolled = true;
				});
				$(imageMap).bind("touchmove.mapify",function(e){
					// adding a touchmove event (even empty) makes the touchstart event below work on map areas in iOS8, don't know why.
				});
				
				zones.css({outline:"none"}).bind("touchend.mapify",function(e){ // fastlick on iOS
				
					if( $(this).hasClass("mapify-clickable") ){
						$(this).trigger("click");
						zones.removeClass("mapify-clickable");
					}
					
					hasScrolled = false;
				
					e.stopPropagation(); // Prevent event bubbling, prevent triggering a document touchend, wich would clear the map.
				
				}).bind("click.mapify",function(e){ 
				
					 // Preventing the click event from being triggered by a human
					 // The click event must be triggered on touchend for the fastclick
					if( e.originalEvent !== undefined && iOS ){
				    	return false;
					}
				
				}).bind("touchstart.mapify",function(e){
					
					zones.removeClass("mapify-clickable");
					if( mapSVG.find("polygon:eq("+$(this).index()+")")[0].classList.contains("mapify-hover") ){
						$(this).addClass("mapify-clickable");
					}else{
						$(this).addClass("mapify-hilightable");
					}
					
				}).bind("touchmove.mapify",function(e){
					
					zones.removeClass("mapify-clickable mapify-hilightable"); // prevent from triggering a click when a touchmove event occured
					
				}).bind("mouseenter.mapify focus.mapify touchend.mapify",function(e){
					
					var elem = this;
				
					if( !$(this).hasClass("mapify-hilightable") && iOS ){
						return false;
					}
				
					clearMap(popOver, mapSVG);
					
					if( popOverIsEnabled ){
						renderPopOver(popOver, elem);
					}
				
					// Now it's time to draw our SVG with the area coordinates
					
					drawHilight(elem,imageMap,mapSVG,settings.hoverClass);
					
					e.preventDefault();
				
				}).bind("mouseout.mapify",function(){
					clearMap(popOver, mapSVG);
				});
				
				if( !iOS ){
				
					zones.bind("blur.mapify",function(){
						clearMap(popOver, mapSVG);
					});
				
				}
				
				// Remaping the coordinates on resize
			
				var timer;
				$(window).bind('resize.mapify', function(){ // on resizeStop event
				
				   timer && clearTimeout(timer);
				   timer = setTimeout(function(){
				
					   if( popOverIsEnabled ){
							if( !popOver.hasClass("mapify-visible") ){
								popOver.css({left: 0, top: 0}); // prevent the popover from overflowing when resizing the window
							}
					   }
						
						mapSVG.find("polygon").attr("points",""); // We must reset the points in Internet explorer, otherwise it overflow the viewport
						
						remapZones(zones, imageMap);
						
						var hilightedZone = zones[mapSVG.find("polygon.mapify-hover").index()];
						
							if( hilightedZone ){
							
								if( popOverIsEnabled ){
					        		renderPopOver(popOver, hilightedZone);
					        	}
					        	
					        	drawHilight(hilightedZone,imageMap,mapSVG,settings.hoverClass);
					        	//console.log("onresizestop");
				        	}
					   
				   }, 100);
				});
				
				var scrollParent = $(imageMap).scrollParent(); // Return the closest scrollable parent
				
				if( $(scrollParent).is(document) ){
					scrollParent = $(window);
				}
				
				scrollParent.addClass("mapify-GPU"); // Add hardware acceleration fix for scroll on iOS
				
				scrollParent.bind("scroll.mapify", function() { // on scrollStop
					
					if( iOS ){
						zones.removeClass("mapify-clickable mapify-hilightable");
					}
					
					if( popOverIsEnabled ){
					
						if( iOS ){
							popOver.css({top: popOver.css("top"), left: popOver.css("left"), transition: "none"});
							popOverArrow.css({marginLeft: popOverArrow.css("margin-left"), transition: "none"});
						}
				
					    clearTimeout($.data(this, 'scrollTimer'));
					    $.data(this, 'scrollTimer', setTimeout(function() {
					        
					        var hilightedZone = zones[mapSVG.find("polygon.mapify-hover").index()];
					        
					        	if( hilightedZone ){
					        	
					        		// Trigger rerender of the popOver when the user stop scrolling
						        	renderPopOver(popOver, hilightedZone);
						        	//console.log("onscrollstop");
						        	
						        	if( iOS ){
							        	popOver.css({top:corners[1], left: corners[0], transition: popOverTransition});
										popOverArrow.css({marginLeft:popOverArrowCompensation, transition: popOverArrowTransition});
									}
					        	}
					        
					    }, 100));
				    
				    }
				});
				
				console.log("mapified");
				
				var popOverTimeOut;
				function clearMap(popOver, mapSVG){
					
					if( popOverIsEnabled ){
						clearTimeout(popOverTimeOut);
										
						popOverTimeOut = setTimeout(function(){
							popOver.removeClass("mapify-visible");
						}, 300);
					}
										
					mapSVG.find("polygon").attr("class","mapify-polygon"); // removeClass and addClass seems to fail on svg 
				}

				function renderPopOver(popOver, elem){
				
					var area = $(elem)[0];
					var cornersArray = getAreaCorners(area);
					var corners = cornersArray["center top"];
					var popOverWidth = popOver.outerWidth();
					var borderOffset = settings.popOver.margin;
					
					// set popOver max-width based on the scrollparent width if it exceeds the scrollparent width
					if( scrollParent.width() - (borderOffset*2) <= popOverWidth ){
						popOverWidth = scrollParent.width() - (borderOffset*2);
						popOver.css({
							maxWidth: popOverWidth
						});
					}else if( mapHolder.width() - (borderOffset*2) <= popOverWidth ){
					// set popOver max-width based on the current map width if it exceeds the map width
						popOverWidth = mapHolder.width() - (borderOffset*2);
						popOver.css({
							maxWidth: popOverWidth
						});
					}else{
						popOver.css({
							maxWidth: ""
						});
					}
					
					popOver.css({
						marginLeft: -(popOverWidth/2)
					});
					
					var compensation = 0;
					
					if( mapHolder.width() < scrollParent.width() ){ // if the map is smaller than the viewport
					
						var positionLeft = (corners[0]-(popOverWidth/2))-scrollParent.scrollLeft();
					
						if( positionLeft + popOverWidth > (mapHolder.width()-borderOffset) ){
							//alert("out of the map right");
							compensation = ((positionLeft + popOverWidth) - mapHolder.width())+borderOffset;
						}else if( positionLeft < borderOffset ){
							//alert("out of the map left");
							compensation = positionLeft-borderOffset;
						}
					
					}else{
					
						var positionLeft = (corners[0]-(popOverWidth/2))-scrollParent.scrollLeft();
					
						if( positionLeft + popOverWidth > (scrollParent.outerWidth()-borderOffset) ){
							//alert("out of the viewport right");
							compensation = ((positionLeft + popOverWidth) - scrollParent.outerWidth())+borderOffset;
						}else if( positionLeft < borderOffset ){
							//alert("out of the viewport left");
							compensation = positionLeft-borderOffset;
						}
					
					}
					
					if( corners[1]-popOver.outerHeight()-borderOffset < 0 ){
						//console.log("out of the map top");
						corners = cornersArray["center bottom"];
						popOver.addClass("mapify-to-bottom");
					}else if( popOver.hasClass("mapify-to-bottom") ){
						popOver.removeClass("mapify-to-bottom");
					}
					
					corners[0] -= compensation;
					var popOverArrowCompensation = compensation;
					
					if( compensation > ((popOverWidth/2)-(borderOffset*2)) ){
						//console.log("arrow out right");
						popOverArrowCompensation = (popOverWidth/2)-(borderOffset*2);
					}else if( compensation < -((popOverWidth/2)-(borderOffset*2)) ){
						//console.log("arrow out left");
						popOverArrowCompensation = -(popOverWidth/2)+(borderOffset*2);
					}
					
					// prevent the popOver from sliding in of nowhere
					if( !popOver.hasClass("mapify-visible") ){
						popOver.css({top:corners[1], left: corners[0], transition: "none"});
						
						popOverArrow.css({marginLeft:popOverArrowCompensation, transition: "none"});
					}
					
					clearTimeout(popOverTimeOut); 
					popOverTimeOut = setTimeout( function(){  // We use a delay otherwise the popOver go crazy on mousemove
					
						var content = settings.popOver.content($(elem),imageMap);
					
						popOver.find(".mapify-popOver-content").html(content);
						if( popOver.hasClass("mapify-to-bottom") ){
							popOver.css({marginTop: ""});
							if( !popOver.hasClass("mapify-bottom") ){
								popOverArrow.css({marginLeft:compensation, transition: "none"});
							}
							popOver.addClass("mapify-bottom");
							popOver.removeClass("mapify-to-bottom");
						}else{
							if( popOver.hasClass("mapify-bottom") ){
								popOverArrow.css({marginLeft:compensation, transition: "none"});
							}
							popOver.removeClass("mapify-bottom");
							popOver.css({marginTop: -popOver.outerHeight()});
						}
					
						setTimeout(function(){
							popOver.css({top:corners[1], left: corners[0], transition: popOverTransition}).addClass("mapify-visible");
							popOverArrow.css({marginLeft:popOverArrowCompensation, transition: popOverArrowTransition});
						}, 10); // prevent transitions when set to none
						
					}, 100);
				}
			
			}// End of "mapification"
			
			remapZones(zones, imageMap);
			
			$(imageMap).bind("load.mapify",function(){ // We must wait for the image to load in safari
				remapZones(zones, imageMap);
			});
		
		});
    
        return "mapified";
    };
    
    $.fn.scrollParent = function() {
	  var position = this.css( "position" ),
	  excludeStaticParent = position === "absolute",
	  scrollParent = this.parents().filter( function() {
	    var parent = $( this );
	    if ( excludeStaticParent && parent.css( "position" ) === "static" ) {
	      return false;
	    }
	    return (/(auto|scroll)/).test( parent.css( "overflow" ) + parent.css( "overflow-y" ) + parent.css( "overflow-x" ) );
	  }).eq( 0 );
	
	  return position === "fixed" || !scrollParent.length ? $( this[ 0 ].ownerDocument || document ) : scrollParent;
	};
	
	function drawHilight(area,imageMap,mapSVG,hoverClass){
		var coords = $(area).attr('data-coords').split(',');
		var zone = "";	
								
		// Generating our points map based on the csv coordinates
		for (key in coords) { // Convert percentage coordinates back to pixel coordinates relative to the image size
			if(key % 2 == 0){  // X
				zone += ($(imageMap).width()*(coords[key]/100));
			}else{ // Y
				zone += ","+($(imageMap).height()*(coords[key]/100))+" ";
			}
		}
							
		var polygon = mapSVG.find("polygon:eq("+$(area).index()+")");
		
		polygon.attr("points", zone).attr('class', function(index, classNames) {
		    return classNames + ' mapify-hover';
		});
		
		if( hoverClass != "" ){
			polygon.attr("points", zone).attr('class', function(index, classNames) {
			    return classNames + ' '+hoverClass;
			});
		}
	}
	
	function remapZones(zones, imageMap){
		zones.each(function(){
									   
			var coords = $(this).attr("data-coords").split(',');
											
			for (key in coords) { // Convert percentage coordinates back to pixel coordinates relative to the image size
				if(key % 2 == 0){  // X
					coords[key] = ($(imageMap).width()*(coords[key]/100));
				}else{ // Y
					coords[key] = ($(imageMap).height()*(coords[key]/100));
				}
			}
			$(this).attr("coords", coords.toString());
		});
	}
	
	function getAreaCorners(area) {
		var coords = area.getAttribute('coords');
		var coordsArray = coords.split(','),
			corners = [];
	
		var coord,
			minX = maxX = parseInt(coordsArray[0], 10),
			minY = maxY = parseInt(coordsArray[1], 10);
			
			for (var i = 0, l = coordsArray.length; i < l; i++) {
				
				coord = parseInt(coordsArray[i], 10);
			    
			    if( i%2 == 0 ){
			    	if( coord < minX ){
			        	minX = coord;
			        }else if ( coord > maxX ){
						maxX = coord;
					}
			    }else{
			    	if( coord < minY ){
			        	minY = coord;
			        }else if( coord > maxY ){
			        	maxY = coord;
			        }
			    }
			}
			        
			minX = minX;
			maxX = maxX;
			minY = minY;
			maxY = maxY;
			        
			centerX = parseInt((minX + maxX) / 2, 10);
			centerY = parseInt((minY + maxY) / 2, 10);
			        
			corners = {
				"center top":    {0: centerX,1: minY },
				"center bottom": {0: centerX,1: maxY }
			};   
					
			return(corners);
	}
 
}( jQuery ));