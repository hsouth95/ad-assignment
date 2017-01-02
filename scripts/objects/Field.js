var Field = function(objects) {
    this.name = objects.name;
    this.initialValue = objects.value || null;
    this.type = objects.type || "text";
    this.disabled = objects.disabled || false;
}

Field.prototype.getLabelElement = function(idPrefix) {
    var label = document.createElement("label");
    label.innerHTML = this.name.charAt(0).toUpperCase() + this.name.splice(1);
    label.for = idPrefix ? idPrefix + this.name : this.name; 
}

Field.prototype.getInputElement = function(idPrefix){
    var input = document.createElement("input");
    input.name = this.name;
    input.placeholder = this.initialValue;
    input.type = this.type;
    input.disabled = this.disabled;
    input.id = idPrefix ? idPrefix + this.name : this.name;

    return input;
}