# Mapify plugin

Responsive and stylable image maps using jQuery, SVG and CSS3

Project website: http://etiennemartin.ca/mapify/
 
## Basic usage

Embed [jquery.mapify.css](https://github.com/etienne-martin/mapify/blob/master/build/jquery.mapify.css) and [jquery.mapify.js](https://github.com/etienne-martin/mapify/blob/master/build/jquery.mapify.js) in your page and call the plugin with the following function:

```javascript
$("img[usemap]").mapify();
```

## Popovers

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
Custom class for a specific popOver
```html
<area data-pop-over-class="customPopOver" href="#" shape="poly" coords="..." />
``` 

## Hover effects
Custom hover class for all areas

```javascript
$("img[usemap]").mapify({
	hoverClass: "custom-hover"
});  
```  
Custom hover class for a specific area
```html
<area data-hover-class="customHover2" href="#" shape="poly" coords="..." />
``` 

Group multiple areas together
  
```html
<area data-group-id="group1" href="#" shape="poly" coords="..." />
<area data-group-id="group1" href="#" shape="poly" coords="..." />
``` 
    
## Stylable with css

```css

.customPopOver{
	background: #09f;
}

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

.custom-hover2{
	fill: #09f;
	stroke: #fff;
	stroke-width: 2;
}
```

## Examples

See http://etiennemartin.ca/mapify/ for live examples.
