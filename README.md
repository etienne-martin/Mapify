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
<area data-pop-over-class="custom-popover" href="#" shape="poly" coords="..." />
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
<area data-hover-class="custom-hover-2" href="#" shape="poly" coords="..." />
``` 

Group multiple areas together
  
```html
<area data-group-id="group-1" href="#" shape="poly" coords="..." />
<area data-group-id="group-1" href="#" shape="poly" coords="..." />
``` 
    
## Stylable with css

```css

.custom-popover{
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

.custom-hover-2{
	fill: #09f;
	stroke: #fff;
	stroke-width: 2;
}
```

## Examples

See http://etiennemartin.ca/mapify/ for live examples.

## Built With

* [Grunt](https://gruntjs.com/) - The JavaScript Task Runner
* [jQuery](https://jquery.com/) - A fast, small, and feature-rich JavaScript library
* [Sass](http://sass-lang.com/) - Syntactically Awesome Style Sheets

## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

Update the README.md with details of changes to the plugin.

Update the [demo](https://github.com/etienne-martin/Mapify/blob/master/example/index.html) with examples demonstrating the changes to the plugin.

Build the project & test all the features before submitting your pull request.

## Authors

* **Etienne Martin** - *Initial work* - [etiennemartin.ca](http://etiennemartin.ca/)
* **Yehor Konoval** - *Improvements* - [@ekonoval](https://github.com/ekonoval)
* **Brock Fanning** - *Improvements* - [@brockfanning](https://github.com/brockfanning)
* **enscope, s.r.o.** - *Improvements* - [enscope.com](https://www.enscope.com/)

## License

This project is licensed under the MIT License - see the [LICENSE.txt](https://github.com/etienne-martin/Mapify/blob/master/LICENSE.txt) file for details.
