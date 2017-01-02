var Field = function(options) {
    this.name = options.name;
    this.initialValue = options.value || null;
    this.type = options.type || "text";
    this.disabled = options.disabled || false;
    this.friendlyName = options.friendlyName || null;
}

Field.prototype.getLabelElement = function(idPrefix) {
    var label = document.createElement("label");
    label.innerHTML = this.friendlyName || this.name.charAt(0).toUpperCase() + this.name.splice(1);
    label.for = idPrefix ? idPrefix + "-" + this.name : this.name;

    return label;
}

Field.prototype.getInputElement = function(idPrefix){
    var input = document.createElement("input");
    input.name = this.name;
    input.placeholder = this.initialValue;
    input.type = this.type;
    input.disabled = this.disabled;
    input.id = idPrefix ? idPrefix + "-" + this.name : this.name;

    return input;
}