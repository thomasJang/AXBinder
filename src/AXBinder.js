var AXBinder = (function () {
	var _toString = Object.prototype.toString;

	function is_iterable(O) {
		if (O != null && O == O.window) {
			return false;
		} else if (!!(O && O.nodeType == 1)) {
			return false;
		} else if (!!(O && O.nodeType == 11)) {
			return false;
		} else if (typeof O === "undefined") {
			return false;
		} else if (_toString.call(O) == "[object Object]") {
			return true;
		} else if (_toString.call(O) == "[object Array]") {
			return true;
		} else if (_toString.call(O) == "[object String]") {
			return false;
		} else if (_toString.call(O) == "[object Number]") {
			return false;
		} else if (_toString.call(O) == "[object NodeList]") {
			return true;
		} else if (typeof O === "function") {
			return false;
		}
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

	};
	
	klass.prototype.set_els_value = function (el, tagname, type, value) {
		value = [].concat(value);
		var options, i;

		if (tagname == "input") {
			if (type == "checkbox" || type == "radio") {
				i = value.length;
				while (i--) {
					if (el.value === value[i].toString()) {
						el.checked = true;
					}
				}
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
		var _this = this;
		(Function("val", "this." + data_path + " = val;")).call(this.model, value);

		if (is_iterable(value)){
			for(var k in value){
				this.set(data_path + "." + k, value[k]);
			}
		}else {
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