var wait = require('wait-for-event');
var emitter = require('emitter');
var forward = require('forward-events');

//adjust the event name and prepend the emitter to the arguments
function proxyEvent(type, arguments, src) {
	arguments.unshift(src);
	return {
		type:       'control:'+type,
		arguments:  arguments
	}
}

/**
 * Control collection
 * @constructor
 * @params  {Object}  options
 * @params  {String}  options.name    The control name
 */
function ControlCollection(options) {
	this.name = options && options.name || '';
	this.controls = [];
}
emitter(ControlCollection.prototype);

/**
 * Get the name
 * @returns {String}
 */
ControlCollection.prototype.getName = function() {
	return this.name;
};

/**
 * Get the control value
 * @returns {String}
 */
ControlCollection.prototype.getValue = function() {
  var value = {};
  for (var i=0; i<this.controls.length; ++i) {
    var control = this.controls[i];
    value[control.getName()] = control.getValue();
  }
  return value;
};

/**
 * Set the control value
 * @param   {String} value
 * @returns {ControlCollection}
 */
ControlCollection.prototype.setValue = function(value) {
  for (var i=0; i<this.controls.length; ++i) {
    var control = this.controls[i];
    if (value.hasOwnProperty(control.getName())) {
      control.setValue(value[control.getName()]);
    }
  }
  return this;
};

/**
 * Whether the control has previously passed validation
 * @returns {boolean}
 */
ControlCollection.prototype.isValid = function() {
	var valid = true;
	for (var i=0; i<this.controls.length; ++i) {
		valid = valid && this.controls[i].isValid();
	}
	return valid;
};

/**
 * Focus the control input
 * @returns {ControlCollection}
 */
ControlCollection.prototype.focus = function() {
  this.first().focus();
  return this;
};

/**
 * Clear the value and validation state
 * @returns {ControlCollection}
 */
ControlCollection.prototype.clear = function() {
  for (var i=0; i<this.controls.length; ++i) {
    this.controls[i].clear();
  }
  return this;
};

/**
 * Get the number of controls
 * @returns {number}
 */
ControlCollection.prototype.count = function() {
	return this.controls.length;
};

/**
 * Get whether the collection contains a control
 * @returns {boolean}
 */
ControlCollection.prototype.contains = function(control) {
	return this.controls.indexOf(control) !== -1;
};

/**
 * Return the control at the index
 * @param   {number} index
 * @returns {Control}
 */
ControlCollection.prototype.at = function(index) {
	return this.controls[index];
};

/**
 * Get the first control
 * @returns {Control}
 */
ControlCollection.prototype.first = function() {
	return this.controls[0];
};

/**
 * Get the last control
 * @returns {Control}
 */
ControlCollection.prototype.last = function() {
	return this.controls[this.controls.length-1];
};

/**
 * Find the index of a control
 * @param   {Control} control
 * @returns {number}
 */
ControlCollection.prototype.indexOf = function(control) {

//	if (!control instanceof Control) {
//		throw new Error('Parameter is not a control')
//	}

	return this.controls.indexOf(control);
};

/**
 * Get a control with the name
 * @param   {String} name
 * @returns {Control|null}
 */
ControlCollection.prototype.named = function(name) {
	for (var i=0; i<this.controls.length; ++i) {
		if (this.controls[i].getName() === name) {
			return this.controls[i];
		}
	}
	return null;
};

/**
 * Prepend the control to the collection
 * @param   {Control} control
 * @returns {ControlCollection}
 */
ControlCollection.prototype.prepend = function(control) {

//	if (!control instanceof control) {
//		throw new Error('Parameter is not a control')
//	}

	//append the control to the array
	this.controls.unshift(control);

	//forward the control events
	forward(control, this, proxyEvent);

	return this;
};

/**
 * Append the control to the collection
 * @param   {Control} control
 * @returns {ControlCollection}
 */
ControlCollection.prototype.append = function(control) {

//	if (!control instanceof control) {
//		throw new Error('Parameter is not a control')
//	}

	//append the control to the array
	this.controls.push(control);

	//forward the control events
	forward(control, this, proxyEvent);

	return this;
};

/**
 * Remove the control from the collection
 * @param   {Control} control
 * @returns {ControlCollection}
 */
ControlCollection.prototype.remove = function(control) {

//	if (!control instanceof control) {
//		throw new Error('Parameter is not a control')
//	}

	//find the control
	var index = this.controls.indexOf(control);

	//if the control is contained in the collection then remove it
	if (index !== -1) {

		//remove the control from the array
		this.controls.splice(index, 1);

	}

	return this;
};

/**
 * Removes all the controls from the collection
 * @returns {ControlCollection}
 */
ControlCollection.prototype.removeAll = function() {
	while (this.controls.length > 0) {
		this.remove(this.controls[0]);
	}
	return this;
};

/**
 * Iterate the collection passing each control to the callback
 * @param   {Function} callback
 * @returns {ControlCollection}
 */
ControlCollection.prototype.each = function(callback) {
	for (var i=0; i<this.controls.length; ++i) {
		callback.call(this, this.controls[i], i);
	}
	return this;
};

/**
 * Validates the collection of controls
 * @returns {ControlCollection}
 */
ControlCollection.prototype.validate = function() {
	var
		self                = this,
		collectionIsValid   = true,
		collectionValue     = {}
	;

	//listen for the `validate` events
	wait.waitForAll(
		'validate',
		this.controls,
		function(control, controlIsValid, controlValue) {
			collectionIsValid = collectionIsValid && controlIsValid;
			collectionValue[control.getName()] = controlValue;
		},
		function() {
			self.valid = collectionIsValid;
			self.emit('validate', collectionIsValid, collectionValue);
		},
		{passMeTheEmitter: true}
	);

	//validate controls which will trigger the `validate` event
	for (var i=0; i<this.controls.length; ++i) {
		this.controls[i].validate();
	}

	return this;
};

module.exports = ControlCollection;
