/*

 The MIT License (MIT)

 Copyright (c) 2014 etienne-martin
 Contributions by Miro Hudak <mhudak@dev.enscope.com>

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.

 */

;(function ($, window, document, undefined) {

    var defaults = {
        hoverClass: false,
        popOver: false
    };

    // All available options for the plugin
    // noinspection JSUnusedLocalSymbols
    var availableOptions = {
        hoverClass: false,
        popOver: {
            content: function (zone, imageMap) {
                return '';
            },
            customPopOver: {
                selector: false,
                contentSelector: '.mapify-popOver-content',
                visibleClass: 'mapify-visible',
                alwaysVisible: false
            },
            delay: 0.8,
            margin: '10px',
            width: false,
            height: false
        },

        onAreaHighlight: false,
        onMapClear: false,

        instantClickOnMobile: false
    };

    //region --- Internal Mapify Implementation ---

    var userAgent = navigator.userAgent.toLowerCase();
    var iOS = /(ipad|iphone|ipod)/g.test(userAgent);
    var android = /(android)/g.test(userAgent);
    var isMobile = iOS || android;

    Mapify.prototype._initPopOver = function () {
        var $imageMap = $(this.element);
        this.options.popOver.margin = parseInt(this.options.popOver.margin);

        this._timer = null;
        this._popOverTransition = '';
        this._popOverArrowTransition = '';
        this._popOverTimeout = null;

        if (!isNaN(this.options.popOver.delay)) {
            // if delay is a number, use it as seconds
            this._popOverTransition = "all " + this.options.popOver.delay + "s";
            this._popOverArrowTransition = "margin " + this.options.popOver.delay + "s";
        }

        this.popOver = false;
        this.popOverArrow = false;
        if (this.isPopOverEnabled) {
            if (this.isCustomPopOver) {
                // if custom pop-over is defined, add defaults
                if ((typeof this.options.popOver.customPopOver == 'string')) {
                    this.options.popOver.customPopOver.selector = this.options.popOver.customPopOver;
                }
                this.options.popOver.customPopOver = $.extend(true, {},
                    availableOptions.popOver.customPopOver, this.options.popOver.customPopOver);
                this.popOver = $(this.options.popOver.customPopOver.selector);
                this.popOver.css({'transition': this._popOverTransition});
            } else {
                $imageMap.after(
                    '<div class="mapify-popOver" style="transition:' + this._popOverTransition + '; ">' +
                    '<div class="mapify-popOver-content"></div>' +
                    '<div class="mapify-popOver-arrow" style="transition:' + this._popOverArrowTransition + '; "></div>' +
                    '</div>');

                this.popOver = $imageMap.next('.mapify-popOver');
                this.popOverArrow = this.popOver.find('.mapify-popOver-arrow');
                this.popOver.css({
                    width: this.options.popOver.width,
                    height: this.options.popOver.height
                });
            }
        }
    };

    Mapify.prototype._initImageMap = function () {
        var _this = this,
            $imageMap = $(this.element);

        this.map = $imageMap.attr('usemap');
        this.zones = $(this.map).find('area');

        if (!$imageMap.hasClass('mapify')) {
            $imageMap.addClass('mapify');

            this._mapWidth = parseInt($imageMap.attr('width'));
            this._mapHeight = parseInt($imageMap.attr('height'));
            if (!this._mapWidth || !this._mapHeight) {
                window.alert('ERROR: The width and height attributes must be specified on your image.');
                return (false);
            }

            $imageMap.wrap(function () {
                return ('<div class="mapify-holder"></div>');
            });

            this._mapHolder = $imageMap.parent();
            $(this.map).appendTo(this._mapHolder);
            $imageMap.before('<img class="mapify-img" src="' + $imageMap.attr("src") + '" />');

            $imageMap.before('<svg class="mapify-svg" width="' + this._mapWidth + '" height="' + this._mapHeight + '"></svg>');
            this.svgMap = $imageMap.prev('.mapify-svg');

            // perform zones initialization
            this.zones.each(function () {
                _this._initSingleZone(this);
            });

            $imageMap.wrap(function () {
                return '<div class="mapify-imgHolder"></div>';
            }).css('opacity', 0);
        }
    };

    Mapify.prototype._initSingleZone = function (zone) {
        switch ($(zone).attr('shape')) {
            case 'rect':
                var rectCoords = $(zone).attr("coords").split(','),
                    fixedCoords = [];

                // From the top/left and bottom/right coordinates of the rect, we
                // can infer top/left, bottom/left, bottom/right, and top/right
                // in order to make a proper polygonal shape.
                $.each([0, 1, 0, 3, 2, 3, 2, 1], function (index, value) {
                    fixedCoords.push(rectCoords[value]);
                });
                $(zone).attr('coords', fixedCoords.join(','));
                $(zone).attr('shape', 'poly');
                break;
            case 'poly':
                // supported, passthru
                break;
            default:
                console.log('ERROR: Area shape type "' + $(zone).attr('shape') + '" is not supported.');
                return (false);
        }

        // store default pixel coordinates for later use
        $(zone).attr('data-coords-default', $(zone).attr('coords'));

        if (this.isPopOverEnabled) {
            // Prevent that little anoying bubble from
            // poping up when the popover is activated
            $(zone).removeAttr('alt')
                .attr('data-title', $(zone).attr('title'))
                .removeAttr('title');
        }

        var coords = $(zone).attr('coords').split(',');
        for (var key in coords) { // convert the pixel coordinates to percentage
            if (key % 2 == 0) {  // X
                coords[key] = coords[key] * 100 / this._mapWidth;
            } else { // Y
                coords[key] = coords[key] * 100 / this._mapHeight;
            }
        }
        $(zone).attr('data-coords', coords.toString()); // store the percentage coordinates for later use

        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.className = 'mapify-polygon';
        polygon.setAttribute('fill', 'none');

        this.svgMap.append(polygon);
    };

    Mapify.prototype._bindEvents = function () {
        var _this = this,
            $imageMap = $(this.element);

        this._hasScrolled = false;

        $(document).bind('touchend.mapify', function () {
            if (!_this._hasScrolled) {
                _this._clearMap();
            }
            _this._hasScrolled = false;
        }).bind('touchmove.mapify', function () {
            _this._hasScrolled = true;
        });

        $imageMap.bind('touchmove.mapify', function (e) {
            // adding a touchmove event (even empty) makes the touchstart
            // event below work on map areas in iOS8, don't know why.
        });

        this._bindZoneEvents();
        this._bindWindowEvents();
        this._bindScrollParentEvents();
    };

    Mapify.prototype._bindZoneEvents = function () {
        var _this = this;

        this.zones.css({outline: 'none'});
        this.zones.bind('touchend.mapify', function (e) { // fast-click on iOS
            if ($(this).hasClass('mapify-clickable')) {
                $(this).trigger('click');
                _this.zones.removeClass('mapify-clickable');
            }
            _this.hasScrolled = false;
            e.stopPropagation(); // Prevent event bubbling, prevent triggering a document touchend, wich would clear the map.
        }).bind('click.mapify', function (e) {
            // Preventing the click event from being triggered by a human
            // The click event must be triggered on touchend for the fast-click
            if ((e.originalEvent !== undefined) && isMobile) {
                return (false);
            }
        }).bind('touchstart.mapify', function () {
            _this.zones.removeClass('mapify-clickable');
            var polygon = _this.svgMap.find('polygon:eq(' + $(this).index() + ')')[0];
            
            // DO NOT USE hasClass on SVGs, it won't work. Use .classList.contains() instead.
            // Issue #25: https://github.com/etienne-martin/mapify/issues/25
            
            if( polygon.classList.contains("mapify-hover") ){
                $(this).addClass('mapify-clickable');
            } else {
                if (isMobile && _this.options.instantClickOnMobile) {
                    console.log('Triggering instantClickOnMobile after touchstart');
                    $(this).addClass('mapify-clickable');
                } else {
                    $(this).addClass('mapify-hilightable');
                }
            }
        }).bind('touchmove.mapify', function () {
            // prevent from triggering a click when a touch-move event occurred
            _this.zones.removeClass('mapify-clickable mapify-hilightable');
        }).bind('mouseenter.mapify focus.mapify touchend.mapify', function (e) {
            var zone = this;
            if (!$(this).hasClass('mapify-hilightable') && isMobile) {
                return (false);
            }

            _this._clearMap();
            if (_this.isPopOverEnabled) {
                _this._renderPopOver(zone);
            }

            // Now it's time to draw our SVG with the area coordinates
            _this._drawHighlight(zone);

            e.preventDefault();
        }).bind("mouseout.mapify", function () {
            _this._clearMap();
        });

        if (!isMobile) {
            this.zones.bind('blur.mapify', function () {
                _this._clearMap();
            });
        }
    };

    Mapify.prototype._bindWindowEvents = function () {
        var _this = this;
        $(window).bind('resize.mapify', function () { // on resizeStop event

            _this._timer && clearTimeout(_this._timer);
            _this._timer = setTimeout(function () {

                if (_this.isPopOverEnabled) {
                    if (!_this.popOver.hasClass('mapify-visible')) {
                        if (!_this.isCustomPopOver) {
                            // prevent the popover from overflowing when resizing the window
                            _this.popOver.css({left: 0, top: 0});
                        }
                    }
                }

                // We must reset the points in Internet explorer, otherwise it overflow the viewport
                _this.svgMap.find('polygon').attr('points', '');

                _this._remapZones();

                var hlZone = _this.zones[_this.svgMap.find('polygon.mapify-hover').index()];
                if (hlZone) {
                    if (_this.isPopOverEnabled) {
                        _this._renderPopOver(hlZone);
                    }
                    _this._drawHighlight(hlZone);
                }

            }, 100);
        });
    };

    Mapify.prototype._bindScrollParentEvents = function () {
        var _this = this;

        // noinspection JSUnresolvedFunction
        this.scrollParent = $(this.element).mapify_scrollParent();

        if (this.scrollParent.is(document)) {
            this.scrollParent = $(window);
        }

        this.scrollParent
            .addClass('mapify-GPU')
            .bind('scroll.mapify', function () { // on scrollStop
                if (isMobile) {
                    _this.zones.removeClass('mapify-clickable mapify-hilightable');
                }

                if (_this.isPopOverEnabled) {
                    if (!_this.isCustomPopOver && isMobile) {
                        _this.popOver.css({
                            top: _this.popOver.css('top'),
                            left: _this.popOver.css('left'),
                            transition: 'none'
                        });
                        _this.popOverArrow.css({
                            marginLeft: _this.popOverArrow.css('margin-left'),
                            transition: 'none'
                        });
                    }

                    clearTimeout($.data(this, 'scrollTimer'));
                    $.data(this, 'scrollTimer', setTimeout(function () {
                        var hlZone = _this.zones[_this.svgMap.find('polygon.mapify-hover').index()];
                        if (hlZone) {
                            // Trigger re-render of the popOver when the user stop scrolling
                            _this._renderPopOver(hlZone);

                            var _tmp = _this._computePopOverCompensation(hlZone),
                                arrowCompensation = _tmp[1],
                                corners = _tmp[2];

                            if (!_this.isCustomPopOver && isMobile) {
                                _this.popOver.css({
                                    top: corners[1],
                                    left: corners[0],
                                    transition: _this._popOverTransition
                                });
                                _this.popOverArrow.css({
                                    marginLeft: arrowCompensation,
                                    transition: _this._popOverArrowTransition
                                });
                            }
                        }
                    }, 100));
                }
            });
    };

    Mapify.prototype._drawHighlight = function (zone) {
        var _this = this,
            groupIdValue = $(zone).attr('data-group-id'),
            hoverClass = $(zone).attr('data-hover-class'); // Use .attr instead of .data https://github.com/etienne-martin/Mapify/issues/27 

        // Combine hover classes
        hoverClass = hoverClass ? this.options.hoverClass + " " + hoverClass : this.options.hoverClass;
        
        if (!groupIdValue) {
            this._highlightSingleArea(zone, hoverClass);
        } else {
            // Highlight areas of the same map id which have the same groupId
            $(zone).siblings('area[data-group-id=' + groupIdValue + ']').addBack().each(function () {
                _this._highlightSingleArea(this, hoverClass);
            });
        }

        // call area highlight event if assigned
        if (this.options.onAreaHighlight) {
            this.options.onAreaHighlight(this, zone);
        }
    };

    Mapify.prototype._highlightSingleArea = function (zone, hoverClass) {
        var coords = $(zone).attr('data-coords').split(',');
        var zonePoints = '';

        // Generating our points map based on the csv coordinates
        for (var key in coords) { // Convert percentage coordinates back to pixel coordinates relative to the image size
            if (key % 2 == 0) {  // X
                zonePoints += ($(this.element).width() * (coords[key] / 100));
            } else { // Y
                zonePoints += ',' + ($(this.element).height() * (coords[key] / 100)) + ' ';
            }
        }

        var polygon = this.svgMap.find('polygon:eq(' + $(zone).index() + ')')[0];
        $(polygon)
            .attr('points', zonePoints)
            .attr('class', function (index, classNames) {
                var result = classNames;
                if (!$(polygon).hasClass('mapify-hover')) {
                    result += ' mapify-hover';
                    if (hoverClass) {
                        result += ' ' + hoverClass;
                    }
                }
                return (result);
            });
    };

    Mapify.prototype._remapZones = function () {
        var _this = this;
        this.zones.each(function () {
            var coords = $(this).attr('data-coords').split(',');
            for (var key in coords) { // Convert percentage coordinates back to pixel coordinates relative to the image size
                if (key % 2 == 0) {  // X
                    coords[key] = ($(_this.element).width() * (coords[key] / 100));
                } else { // Y
                    coords[key] = ($(_this.element).height() * (coords[key] / 100));
                }
            }
            $(this).attr('coords', coords.toString());
        });
    };

    Mapify.prototype._renderPopOver = function (zone) {
        if (!this.isCustomPopOver) {
            this._renderDefaultPopOver(zone);
        } else {
            this._renderCustomPopOver(zone);
        }
    };

    Mapify.prototype._renderCustomPopOver = function (zone) {
        var _this = this,
            customPopOver = this.options.popOver.customPopOver,
            $popOver = this.popOver;

        clearTimeout(this._popOverTimeout);
        this._popOverTimeout = setTimeout(function () {
            var content = _this.options.popOver.content($(zone), _this.element);
            $popOver.find(customPopOver.contentSelector).html(content);

            setTimeout(function () {
                $popOver.css({
                    transition: _this._popOverTransition
                }).addClass(customPopOver.visibleClass);
            }, 10); // prevent transitions when set to none
        }, 100);
    };

    Mapify.prototype._renderDefaultPopOver = function (zone) {
        var _this = this,
            popOverWidth = this.popOver.outerWidth(),
            borderOffset = this.options.popOver.margin,

            $popOver = this.popOver,
            $popOverArrow = this.popOverArrow;

        // remove current pop-over class if some specified
        var currentCustomPopOverClass = $popOver.attr('data-popOver-class');
        if (currentCustomPopOverClass != '') {
            $popOver.removeClass(currentCustomPopOverClass);
            $popOver.attr('data-popOver-class', '');
        }

        // set popOver max-width based on the scrollparent width if it exceeds the scrollparent width
        if (this.scrollParent.width() - (borderOffset * 2) <= popOverWidth) {
            popOverWidth = this.scrollParent.width() - (borderOffset * 2);
            $popOver.css({
                maxWidth: popOverWidth
            });
        } else if (this._mapHolder.width() - (borderOffset * 2) <= popOverWidth) {
            // set popOver max-width based on the current map width if it exceeds the map width
            popOverWidth = this._mapHolder.width() - (borderOffset * 2);
            $popOver.css({
                maxWidth: popOverWidth
            });
        } else {
            $popOver.css({
                maxWidth: ''
            });
        }

        $popOver.css({
            marginLeft: -(popOverWidth / 2)
        });

        var _tmp = this._computePopOverCompensation(zone),
            compensation = _tmp[0],
            arrowCompensation = _tmp[1],
            corners = _tmp[2];

        // prevent the popOver from sliding in of nowhere
        if (!$popOver.hasClass('mapify-visible')) {
            $popOver.css({
                top: corners[1],
                left: corners[0],
                transition: 'none'
            });
            $popOverArrow.css({
                marginLeft: arrowCompensation,
                transition: 'none'
            });
        }

        clearTimeout(this._popOverTimeout);
        this._popOverTimeout = setTimeout(function () {
            // We use a delay otherwise the popOver go crazy on mousemove
            var content = _this.options.popOver.content($(zone), _this.element);

            // allow for custom pop-over class specified in area element
            var customPopOverClass = $(zone).attr('data-pop-over-class');
            if (customPopOverClass != '') {
                $popOver.addClass(customPopOverClass);
                $popOver.attr('data-popOver-class', customPopOverClass);
            }

            $popOver.find('.mapify-popOver-content').html(content);
            if ($popOver.hasClass('mapify-to-bottom')) {
                $popOver.css({marginTop: ''});
                if (!$popOver.hasClass('mapify-bottom')) {
                    $popOverArrow.css({
                        marginLeft: compensation,
                        transition: 'none'
                    });
                }
                $popOver.addClass('mapify-bottom');
                $popOver.removeClass('mapify-to-bottom');
            } else {
                if ($popOver.hasClass('mapify-bottom')) {
                    $popOverArrow.css({
                        marginLeft: compensation,
                        transition: 'none'
                    });
                }
                $popOver.removeClass('mapify-bottom');
                $popOver.css({
                    marginTop: -$popOver.outerHeight()
                });
            }

            setTimeout(function () {
                $popOver.css({
                    top: corners[1],
                    left: corners[0],
                    transition: _this._popOverTransition
                }).addClass('mapify-visible');
                $popOverArrow.css({
                    marginLeft: arrowCompensation,
                    transition: _this._popOverArrowTransition
                });
            }, 10); // prevent transitions when set to none
        }, 100);
    };

    Mapify.prototype._computePopOverCompensation = function (zone) {
        var compensation = 0,
            positionLeft = 0,
            $popOver = this.popOver,
            cornersArray = this._getAreaCorners(zone),
            corners = cornersArray['center top'],
            popOverWidth = $popOver.outerWidth(),
            borderOffset = this.options.popOver.margin;

        if (this._mapHolder.width() < this.scrollParent.width()) { // if the map is smaller than the viewport
            positionLeft = (corners[0] - (popOverWidth / 2)) - this.scrollParent.scrollLeft();
            if (positionLeft + popOverWidth > (this._mapHolder.width() - borderOffset)) {
                compensation = ((positionLeft + popOverWidth) - this._mapHolder.width()) + borderOffset;
            } else if (positionLeft < borderOffset) {
                compensation = positionLeft - borderOffset;
            }
        } else {
            positionLeft = (corners[0] - (popOverWidth / 2)) - this.scrollParent.scrollLeft();
            if (positionLeft + popOverWidth > (this.scrollParent.outerWidth() - borderOffset)) {
                compensation = ((positionLeft + popOverWidth) - this.scrollParent.outerWidth()) + borderOffset;
            } else if (positionLeft < borderOffset) {
                compensation = positionLeft - borderOffset;
            }
        }

        if (corners[1] - $popOver.outerHeight() - borderOffset < 0) {
            corners = cornersArray['center bottom'];
            $popOver.addClass('mapify-to-bottom');
        } else if ($popOver.hasClass('mapify-to-bottom')) {
            $popOver.removeClass('mapify-to-bottom');
        }

        corners[0] -= compensation;
        var arrowCompensation = compensation;

        if (compensation > ((popOverWidth / 2) - (borderOffset * 2))) {
            arrowCompensation = (popOverWidth / 2) - (borderOffset * 2);
        } else if (compensation < -((popOverWidth / 2) - (borderOffset * 2))) {
            arrowCompensation = -(popOverWidth / 2) + (borderOffset * 2);
        }

        return [compensation, arrowCompensation, corners];
    };

    Mapify.prototype._getAreaCorners = function (zone) {
        var coords = zone.getAttribute('coords');
        var coordsArray = coords.split(',');

        var coord,
            minX = parseInt(coordsArray[0], 10),
            maxX = minX,
            minY = parseInt(coordsArray[1], 10),
            maxY = minY;

        for (var i = 0, l = coordsArray.length; i < l; i++) {
            coord = parseInt(coordsArray[i], 10);
            if (i % 2 == 0) {
                if (coord < minX) {
                    minX = coord;
                } else if (coord > maxX) {
                    maxX = coord;
                }
            } else {
                if (coord < minY) {
                    minY = coord;
                } else if (coord > maxY) {
                    maxY = coord;
                }
            }
        }

        var centerX = parseInt((minX + maxX) / 2, 10);
        // noinspection JSUnusedLocalSymbols
        var centerY = parseInt((minY + maxY) / 2, 10);

        return {
            'center top': {0: centerX, 1: minY},
            'center bottom': {0: centerX, 1: maxY}
        };
    };

    Mapify.prototype._clearMap = function () {
        var _this = this;
        if (this.isPopOverEnabled) {
            var shouldHide = true,
                visibleClass = 'mapify-visible';
            if (this.isCustomPopOver) {
                var customPopOver = this.options.popOver.customPopOver;
                visibleClass = customPopOver.visibleClass;
                shouldHide = !customPopOver.alwaysVisible;
            }
            clearTimeout(this._popOverTimeout);
            if (shouldHide) {
                this._popOverTimeout = setTimeout(function () {
                    _this.popOver.removeClass(visibleClass);
                }, 300);
            }
        }

        // removeClass and addClass seems to fail on svg
        this.svgMap.find('polygon').attr('class', 'mapify-polygon');

        // if event is assigned, call the handler
        if (this.options.onMapClear) {
            this.options.onMapClear(this);
        }
    };

    function Mapify(element, options) {
        var _this = this;

        this.element = element;
        this.options = options;

        this.isPopOverEnabled = (this.options.popOver != false);
        this.isCustomPopOver = (this.options.popOver.customPopOver != false)
            && (this.options.popOver.customPopOver != undefined);

        this._initImageMap();
        this._initPopOver();
        this._bindEvents();

        this._remapZones();
        $(this.element).bind('load.mapify', function () {
            // We must wait for the image to load in safari
            _this._remapZones();
        });
    }

    //endregion

    $.fn.mapify = function (options) {
        return this.each(function () {
            if (!$.data(this, 'plugin_mapify')) {
                $.data(this, 'plugin_mapify',
                    new Mapify(this, $.extend(true, {}, defaults, options)));
            }
        });
    };

    $.fn.mapify_scrollParent = function () {
        var position = this.css('position'),
            isExcludeStaticParent = (position === 'absolute'),
            scrollParent = this.parents().filter(function () {
                var parent = $(this);
                if (isExcludeStaticParent
                    && parent.css('position') === 'static') {
                    return (false);
                }
                return (/(auto|scroll)/).test(parent.css('overflow') + parent.css('overflow-y') + parent.css('overflow-x'));
            }).eq(0);

        return (position === 'fixed') || !scrollParent.length
            ? $(this[0].ownerDocument || document)
            : scrollParent;
    };

})(jQuery, window, document);
