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
		this.tmpl        = {};
		this.view_target = null;
		this.trigger     = {};
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

		// collect tmpl
		this.view_target.find('[data-ax-repeat]').each(function () {
			var dom        = $(this), data_path = dom.attr("data-ax-repeat");
			var child_tmpl = {};
			// collect child tmpl

			/*
			var child_list = dom.find('[data-ax-repeat-child]');
			child_list.each(function () {
				var child_dom = $(this);
				var p_el      = this, n_data_path = child_dom.attr("data-ax-repeat-child");
				while (p_el = p_el.parentNode) {
					if (p_el.getAttribute("data-ax-repeat")) {
						break;
					} else if (p_el.getAttribute("data-ax-repeat-child")) {
						n_data_path = p_el.getAttribute("data-ax-repeat-child") + "." + n_data_path;
						child_dom.attr("data-ax-repeat-child", n_data_path);
						break;
					}
				}
				child_tmpl[n_data_path] = {
					content: child_dom.html()
				};
				child_dom.empty();
			});
			*/

			_this.tmpl[data_path] = {
				container: dom, content: dom.html(), child_tmpl: child_tmpl
			};
			dom.empty();
		});

		// binding event to els
		this.view_target.find('[data-ax-path]').bind("change", function () {
			var dom        = $(this), data_path = dom.attr("data-ax-path"), origin_value = (Function("", "return this." + data_path + ";")).call(_this.model), value_type = get_type(origin_value), setAllow = true;
			var i, hasItem = false, checked, new_value = [];

			if (value_type == "object" || value_type == "array") {
				setAllow = false;
			}

			if (this.type.toLowerCase() == "checkbox") {
				if (get_type(origin_value) != "array") {
					origin_value = [].concat(origin_value);
				}
				i = origin_value.length, hasItem = false, checked = this.checked;
				while (i--) {
					if (origin_value[i] == this.value) {
						hasItem = true;
					}
				}
				
				if (checked) {
					if (!hasItem) origin_value.push(this.value);
				} else {
					i = origin_value.length;
					while (i--) {
						if (origin_value[i] == this.value) {
							//hasItemIndex = i;
						} else {
							new_value.push(origin_value[i]);
						}
					}
					origin_value = new_value;
				}

				(Function("val", "this." + data_path + " = val;")).call(_this.model, origin_value);
				_this.change(data_path, {el: this, tagname: this.tagName.toLowerCase(), value: origin_value});
			} else {
				if (setAllow) {
					(Function("val", "this." + data_path + " = val;")).call(_this.model, this.value);
					_this.change(data_path, {el: this, tagname: this.tagName.toLowerCase(), value: this.value});
				}
			}
		});

		//_this.tmpl
		for (var tk in _this.tmpl) {
			this.print_tmpl(tk, _this.tmpl[tk], "isInit");
		}
	};
	
	klass.prototype.set_els_value = function (el, tagname, type, value, data_path) {
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
			if (window.AXSelect) { // AXISJ 사용가능
				$(el).bindSelectSetValue(value[value.length - 1]);
			}
		} else if (tagname == "textarea") {
			el.value = value.join('');
		}

		if (data_path) {
			this.change(data_path, {el: el, tagname: tagname, value: value});
		}
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
					_this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), value, data_path);
			});
			i = value.length;
			while (i--) {
				this.set(data_path + "[" + i + "]", value[i]);
			}
		} else {
			// apply data value to els
			this.view_target.find('[data-ax-path="' + data_path + '"]').each(function () {
				_this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), value, data_path);
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

	klass.prototype.set_onchange = function (data_path, callBack) {
		this.trigger[data_path] = callBack;
		return this;
	};

	klass.prototype.change = function (data_path, that) {
		var callBack = this.trigger[data_path];
		if (callBack) {
			callBack.call(that, that);
		}
	};

	klass.prototype.reload = function () {

	};

	klass.prototype.print_tmpl = function (data_path, tmpl, isInit) {
		//console.log(this.model[data_path]);
		var list = (Function("", "return this." + data_path + ";")).call(this.model);
		if (list && get_type(list) == "array") {

			for (var i = 0, l = list.length; i < l; i++) {
				var item          = list[i];
				item.__i__ = i;
				if(i === 0) item.__first__ = true;

				var fragdom = $(Mustache.render(tmpl.content, item));
				/*
				if (tmpl.child_tmpl) {
					for (var k in tmpl.child_tmpl) {
						if(item[k]) {
							for (var ii = 0, il = item[k].length; ii < il; ii++) {
								var _item          = item[k][ii];
								_item["__i__"] = i;
								fragdom.find('[data-ax-repeat-child="' + k + '"]').html(Mustache.render(tmpl.child_tmpl[k].content, _item));
							}
						}
					}
				}
				*/
				tmpl.container.append(fragdom);
			}

			tmpl.container.bind("change", function(){

			});
		}
	};

	klass.prototype.push = function (data_path, item) {
		var list = (Function("", "return this." + data_path + ";")).call(this.model);
		var tmpl = this.tmpl[data_path];

		item["__i__"] = list.length;
		tmpl.container.append(Mustache.render(tmpl.content, item));
		(Function("val", "this." + data_path + ".push(val);")).call(this.model, item);
	};

	klass.prototype.remove = function (data_path, index) {
		var list = (Function("", "return this." + data_path + ";")).call(this.model);
		if (typeof index == "undefined") index = list.length - 1;
		list.splice(index, 1);

		this.tmpl[data_path].container.empty();
		this.print_tmpl(data_path, this.tmpl[data_path]);
	};

	klass.prototype.update = function () {

	};

	return new klass();
})();