# AXBinder
Simple two way binding javascript, jQuery plugin

[![axisj-contributed](https://img.shields.io/badge/AXISJ.com-OpensourceJavascriptUILibrary-green.svg)](https://github.com/axisj) ![](https://img.shields.io/badge/Seowoo-Mondo&Thomas-red.svg)


```js
var obj = {
	v1: "abcd", v2: "N", v3: "Y", v4: "o2", v5: "multiline\ndatas", v6: {
		c1: {
			cc1: "v6.c1.cc1's value", cc2: "v6.c1.cc2's value", cc3: "v6.c1.cc3's value"
		}
	}
};
```

```html
<div id="form-target">

	v1 : <input type="text" name="input-text" data-ax-path="v1"/>

	<hr/>

	v6.c1.cc1 : <input type="text" name="input-text" data-ax-path="v6.c1.cc1"/>
	v6.c1.cc2 : <input type="text" name="input-text" data-ax-path="v6.c1.cc2"/>
	v6.c1.cc3 : <input type="text" name="input-text" data-ax-path="v6.c1.cc3"/>

	<hr/>

	v2 :
	<label>
		<input type="checkbox" name="checkbox" data-ax-path="v2" value="Y"/>
		Y
	</label>
	<label>
		<input type="checkbox" name="checkbox" data-ax-path="v2" value="N"/>
		N
	</label>

	<hr/>

	v3 :
	<label>
		<input type="radio" name="radio" data-ax-path="v3" value="Y"/>
		Y
	</label>
	<label>
		<input type="radio" name="radio" data-ax-path="v3" value="N"/>
		N
	</label>

	<hr/>

	v4 :
	<select name="select" data-ax-path="v4">
		<option vlaue="o1">o1</option>
		<option vlaue="o2">o2</option>
		<option vlaue="o2">o2</option>
	</select>

	<hr/>

	v5 :
	<textarea name="textarea" data-ax-path="v5"></textarea>


	<div id="div-element"></div>

</div>
```

```js
var myModel = AXBinder.set_model(obj, $("#form-target"));
myModel.set("v6", {c1: {cc1: "-- new cc1", cc2: "-- new cc2", cc3: "-- new cc3"}});
myModel.set("v1", "new value");
console.log(myModel.getAll());
```
