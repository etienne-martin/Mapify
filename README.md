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

#### Examples

See http://etiennemartin.ca/mapify/ for live examples.
