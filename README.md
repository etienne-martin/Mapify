# Mapify plugin

Responsive and stylable image maps using jQuery, SVG and CSS3

Project website: http://etiennemartin.ca/mapify/
 
#### Basic usage

```javascript
$("img[usemap]").mapify();
```

#### Popovers

```javascript
$("img[usemap]").mapify({
	popOver: {
  		content: function(zone){ 
  				return "<strong>"+zone.attr("data-title")+"</strong>"+zone.attr("data-nbmembre")+" Members";
  		},
  		delay: 0.7,
  		margin: "15px",
  		height: "130px",
  		width: "260px"
  	}
});
```    

##### Custom hoverClass

```javascript
$("img[usemap]").mapify({
	hoverClass: "custom-hover"
});  
```    

##### Stylable with css

```css
.mapify-hover{
	fill:rgba(0,0,0,0.15);
	stroke: #fff;
	stroke-width: 2;
}
	
.custom-hover{
	fill:rgba(0,0,0,0.15);
	stroke: #fff;
	stroke-width: 2;
}
```

##### All Available Options

```javascript
$("img[usemap]").mapify({
    hoverClass: 'mapify-hover',
    popOver: {
        content: function (zone, imageMap) {
            return '';
        },
        
        /* ability to create custom pop-over code */
        customPopOver: {
            selector: false,
            contentSelector: '.mapify-popOver-content',
            visibleClass: 'mapify-visible',
            alwaysVisible: false
        },
        
        delay: 0.8,
        margin: '10px',
        width: false,
        height: false,
        
        /* event callbacks */
        onAreaHighlight: false,
        onMapClear: false
    }
});
```

#### Examples

See http://etiennemartin.ca/mapify/ for live examples.
