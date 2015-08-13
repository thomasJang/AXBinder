var AXBinder = (function () {
	var _toString = Object.prototype.toString;

	function get_type(O) {
		var typeName;
		if (O != null && O == O.window) {
			typeName = "window";
		} else if (!!(O && O.nodeType == 1)) {
			typeName = "element";
		} else if (!!(O && O.nodeType == 11)) {
			typeName = "fragment";
		} else if (typeof O === "undefined") {
			typeName = "undefined";
		} else if (_toString.call(O) == "[object Object]") {
			typeName = "object";
		} else if (_toString.call(O) == "[object Array]") {
			typeName = "array";
		} else if (_toString.call(O) == "[object String]") {
			typeName = "string";
		} else if (_toString.call(O) == "[object Number]") {
			typeName = "number";
		} else if (_toString.call(O) == "[object NodeList]") {
			typeName = "nodelist";
		} else if (typeof O === "function") {
			typeName = "function";
		}
		return typeName;
	}

	var klass = function () {
		this.model       = {};
		this.view_target = null;
	};

	klass.prototype.set_model = function (model, view_target) {
		this.model       = model;
		this.view_target = view_target;

		this._binding();
		return this;
	};

	klass.prototype._binding = function () {
		var _this = this;

		// apply data value to els
		this.view_target.find('[data-ax-path]').each(function () {
			var dom = $(this), data_path = dom.attr("data-ax-path");

			var val = "";
			try {
				val = (Function("", "return this." + data_path + ";")).call(_this.model);
			} catch (e) {
				console.log("not found target [model." + data_path + "]");
			}

			_this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), val);
		});

		// binding event to els
		this.view_target.find('[data-ax-path]').bind("change", function () {
			var dom = $(this),
			    data_path = dom.attr("data-ax-path"),
			    origin_value = (Function("", "return this." + data_path + ";")).call(_this.model),
			    value_type = get_type(origin_value),
			    setAllow = true;

			if (value_type == "object" || value_type == "array") {
				setAllow = false;
			}

			if (this.type.toLowerCase() == "checkbox") {
				if(get_type(origin_value) != "array"){
					origin_value = [].concat(origin_value);
				}
				var i = origin_value.length, hasItem = false, hasItemIndex, checked = this.checked;
				while(i-- && hasItem){
					if(origin_value[i] != this.value){
						hasItem = true;
						hasItemIndex = i;
					}
				}
				if(checked) {
					if (!hasItem) origin_value.push(this.value);
				}else{
					if(hasItem){
						origin_value.splice(hasItemIndex, 1);
					}
				}
				(Function("val", "this." + data_path + " = val;")).call(_this.model, origin_value);
			} else {
				if (setAllow) {
					(Function("val", "this." + data_path + " = val;")).call(_this.model, this.value);
				}
			}
		});
	};
	
	klass.prototype.set_els_value = function (el, tagname, type, value) {
		value = [].concat(value);
		var options, i;

		if (tagname == "input") {
			if (type == "checkbox" || type == "radio") {
				i           = value.length;
				var checked = false;
				while (i--) {
					if (el.value === value[i].toString()) {
						checked = true;
					}
				}
				el.checked = checked;
			} else {
				el.value = value.join('');
			}
		} else if (tagname == "select") {
			options = el.options, i = options.length;
			while (i--) {
				var vi = value.length;
				while (vi--) {
					if (options[i].value === value[vi].toString()) {
						options[i].selected = true;
					}
				}
			}
		} else if (tagname == "textarea") {
			el.value = value.join('');
		}
	};

	klass.prototype.$ = function () {

		return this;
	};

	klass.prototype.set = function (data_path, value) {
		var _this = this, obj_type, i;
		(Function("val", "this." + data_path + " = val;")).call(this.model, value);
		obj_type  = get_type(value);

		if (obj_type == "object") {
			for (var k in value) {
				this.set(data_path + "." + k, value[k]);
			}
		} else if (obj_type == "array") {
			this.view_target.find('[data-ax-path="' + data_path + '"]').each(function () {
				if (this.type.toLowerCase() == "checkbox" || this.type.toLowerCase() == "radio")
					_this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), value);
			});
			i = value.length;
			while (i--) {
				this.set(data_path + "[" + i + "]", value[i]);
			}
		} else {
			// apply data value to els
			this.view_target.find('[data-ax-path="' + data_path + '"]').each(function () {
				_this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), value);
			});
		}
		return this;
	};

	klass.prototype.get = function (data_path) {
		return (typeof data_path == "undefined") ? this.model : (Function("", "return this." + data_path + ";")).call(this.model);
	};

	klass.prototype.getAll = function () {
		return this.get();
	};

	return new klass();
})();