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
		this.model          = {};
		this.tmpl           = {};
		this.view_target    = null;
		this.change_trigger = {};
		this.click_trigger  = {};
		this.onerror        = null;
	};

	klass.prototype.set_model = function (model, view_target) {
		this.model       = model;
		this.view_target = view_target;

		this._binding();
		return this;
	};

	klass.prototype.update_model = function (model) {
		this.model = model;
		this._binding("update");
		return this;
	};

	klass.prototype._binding = function (isupdate) {
		var _this = this;

		// apply data value to els
		this.view_target.find('[data-ax-path]').each(function () {
			var dom = $(this), data_path = dom.attr("data-ax-path");

			var val;
			try {
				val = (Function("", "return this." + data_path + ";")).call(_this.model);
			} catch (e) {
				/**
				 * onerror를 선언 한 경우에만 에러 출력
				 * */
				if (_this.onerror) _this.onerror("not found target [model." + data_path + "]");
			}

			if (typeof val !== "undefined") _this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), val);
		});

		if (typeof isupdate == "undefined") {
			// collect tmpl
			this.view_target.find('[data-ax-repeat]').each(function () {
				var dom               = $(this), data_path = dom.attr("data-ax-repeat");
				var child_tmpl        = {};
				_this.tmpl[data_path] = {
					container: dom, content: dom.html(), child_tmpl: child_tmpl
				};
				dom.empty().show();
			});
		} else {
			this.view_target.find('[data-ax-repeat]').each(function () {
				var dom = $(this);
				dom.empty().show();
			});
		}

		// binding event to els
		this.view_target.find('[data-ax-path]').unbind("change.axbinder").bind("change.axbinder", function () {
			var dom        = $(this), data_path = dom.attr("data-ax-path"), origin_value = (Function("", "return this." + data_path + ";")).call(_this.model), value_type = get_type(origin_value), setAllow = true;
			var i, hasItem = false, checked, new_value = [];

			if (value_type == "object" || value_type == "array") {
				setAllow = false;
			}

			if (this.type.toLowerCase() == "checkbox") {
				if (get_type(origin_value) != "array") {
					if (typeof origin_value === "undefined") origin_value = [];
					else origin_value = [].concat(origin_value);
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
				_this.change(data_path, {
					el     : this,
					jquery : dom,
					tagname: this.tagName.toLowerCase(),
					value  : origin_value
				});
			} else {
				if (setAllow) {
					(Function("val", "this." + data_path + " = val;")).call(_this.model, this.value);
					_this.change(data_path, {
						el     : this,
						jquery : dom,
						tagname: this.tagName.toLowerCase(),
						value  : this.value
					});
				}
			}
		});

		//_this.tmpl
		for (var tk in _this.tmpl) {
			this.print_tmpl(tk, _this.tmpl[tk], "isInit");
		}
	};
	
	klass.prototype.set_els_value = function (el, tagname, type, value, data_path) {
		if (typeof value === "undefined") value = []; else value = [].concat(value);
		var options, i;

		if (tagname == "input") {
			if (type == "checkbox" || type == "radio") {
				i           = value.length;
				var checked = false;
				while (i--) {
					if (typeof value[i] !== "undefined" && el.value === value[i].toString()) {
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
					if (typeof value[vi] !== "undefined" && options[i].value === value[vi].toString()) {
						options[i].selected = true;
					}
				}
			}
			if (window.AXSelect) { // AXISJ 사용가능
				$(typeof value !== "undefined" && el).bindSelectSetValue(value[value.length - 1]);
			}
		} else if (tagname == "textarea") {
			el.value = value.join('') || "";
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

	klass.prototype.onchange = function (data_path, callBack) {
		this.change_trigger[data_path || "*"] = callBack;
		return this;
	};

	klass.prototype.change = function (data_path, that) {
		var callBack = this.change_trigger[data_path];
		if (callBack) {
			callBack.call(that, that);
		}
		if (data_path != "*" && this.change_trigger["*"]) {
			this.change_trigger["*"].call(that, that);
		}
	};

	klass.prototype.onclick = function (data_path, callBack) {
		this.click_trigger[data_path] = callBack;
		return this;
	};

	klass.prototype.click = function (data_path, that) {
		var callBack = this.click_trigger[data_path];
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
				var item   = list[i];
				item.__i__ = i;
				if (i === 0) item.__first__ = true;
				if (!item.__DELETED__) {
					var fragdom = $(Mustache.render(tmpl.content, item));
					fragdom.attr("data-ax-repeat-i", item.__i__);
					this.bind_event_tmpl(fragdom, data_path);
					tmpl.container.append(fragdom);
				}
			}
		}
	};

	klass.prototype.bind_event_tmpl = function (target, data_path) {
		var _this = this, index = target.attr("data-ax-repeat-i");
		var list  = (Function("", "return this." + data_path + ";")).call(this.model);

		target.find('[data-ax-repeat-click]').unbind("click.axbinder").bind("click.axbinder", function (e) {
			var dom = $(e.target), value = dom.attr("data-ax-repeat-click"), repeat_path = dom.attr("data-ax-repeat-path");

			var that = {
				el         : e.target,
				jquery     : dom,
				tagname    : e.target.tagName.toLowerCase(),
				value      : value,
				repeat_path: data_path,
				item       : list[index],
				item_index : index,
				item_path  : data_path + "[" + index + "]"
			};

			_this.click(data_path, that);
		});

		// apply data value to els
		target.find('[data-ax-item-path]').each(function () {
			var dom = $(this), item_path = dom.attr("data-ax-item-path"), mix_path = data_path + "[" + index + "]." + item_path + "", val;

			try {
				val = (Function("", "return this." + mix_path + ";")).call(_this.model);
			} catch (e) {
				/**
				 * onerror를 선언 한 경우에만 에러 출력
				 * */
				if (_this.onerror) _this.onerror("not found target [model." + mix_path + "]");
			}
			if (typeof val !== "undefined") _this.set_els_value(this, this.tagName.toLowerCase(), this.type.toLowerCase(), val);
		});

		// binding event to els
		target.find('[data-ax-item-path]').unbind("change.axbinder").bind("change.axbinder", function () {
			var i, hasItem = false, checked, new_value = [];
			var dom        = $(this), item_path = dom.attr("data-ax-item-path"), mix_path = data_path + "[" + index + "]." + item_path + "", origin_value = (Function("", "return this." + mix_path + ";")).call(_this.model), value_type = get_type(origin_value), setAllow = true;

			if (value_type == "object" || value_type == "array") {
				setAllow = false;
			}

			if (this.type.toLowerCase() == "checkbox") {
				if (get_type(origin_value) != "array") {
					if (typeof origin_value === "undefined") origin_value = []; else origin_value = [].concat(origin_value);
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

				(Function("val", "this." + mix_path + " = val;")).call(_this.model, origin_value);
				_this.change(mix_path, {
					el     : this,
					jquery : dom,
					tagname: this.tagName.toLowerCase(),
					value  : origin_value
				});
			} else {
				if (setAllow) {
					(Function("val", "this." + mix_path + " = val;")).call(_this.model, this.value);
					_this.change(mix_path, {
						el     : this,
						jquery : dom,
						tagname: this.tagName.toLowerCase(),
						value  : this.value
					});
				}
			}
		});
	};

	klass.prototype.add = function (data_path, item) {
		var list       = (Function("", "return this." + data_path + ";")).call(this.model);
		var tmpl       = this.tmpl[data_path];
		item.__i__     = list.length;
		item.__ADDED__ = true;

		// 추가되는 하위 아이템 중에 object array를 찾아 __ADDED__ 값을 추가해줍니다.
		for (var k in item) {
			if (get_type(item[k]) == "array" && item[k][0] && get_type(item[k][0]) == "object") {
				for (var ii = 0, il = item[k].length; ii < il; ii++) {
					item[k][ii].__ADDED__ = true;
				}
			}
		}

		var fragdom = $(Mustache.render(tmpl.content, item));
		fragdom.attr("data-ax-repeat-i", item.__i__);

		(Function("val", "this." + data_path + ".push(val);")).call(this.model, item);

		this.bind_event_tmpl(fragdom, data_path);
		tmpl.container.append(fragdom);
		this.change("*");
		return this;
	};

	klass.prototype.remove = function (data_path, index) {
		var list = (Function("", "return this." + data_path + ";")).call(this.model);
		if (typeof index == "undefined") index = list.length - 1;
		var remove_item = list[index];
		if (remove_item.__ADDED__) {
			list.splice(index, 1);
		} else {
			list[index].__DELETED__ = true;
		}
		this.tmpl[data_path].container.empty();
		this.print_tmpl(data_path, this.tmpl[data_path]);
		this.change("*");
		return this;
	};

	klass.prototype.update = function (data_path, index, item) {
		var list = (Function("", "return this." + data_path + ";")).call(this.model);
		if (typeof index == "undefined") return this;
		list.splice(index, 1, item);

		this.tmpl[data_path].container.empty();
		this.print_tmpl(data_path, this.tmpl[data_path]);
		this.change("*");
		return this;
	};

	klass.prototype.child_add = function (data_path, index, child_path, child_item) {
		var _list            = (Function("", "return this." + data_path + ";")).call(this.model);
		var list             = (Function("", "return this." + data_path + "[" + index + "]." + child_path + ";")).call(this.model);
		child_item.__ADDED__ = true;
		list.push(child_item);
		this.update(data_path, index, _list[index]);
	};

	klass.prototype.child_remove = function (data_path, index, child_path, child_index) {
		var _list       = (Function("", "return this." + data_path + ";")).call(this.model);
		var list        = (Function("", "return this." + data_path + "[" + index + "]." + child_path + ";")).call(this.model);
		var remove_item = list[child_index];
		if (remove_item.__ADDED__) {
			list.splice(child_index, 1);
		} else {
			list[child_index].__DELETED__ = true;
		}
		this.update(data_path, index, _list[index]);
	};

	klass.prototype.child_update = function (data_path, index, child_path, child_index, child_item) {
		//MODIFIED

	};

	return new klass();
})();