var AudioObject = function(options) {
    this.id = options.id;
    this.blob_key = options.blob_key;
    this.name = options.name;
    this.extension = options.extension;
    this.duration = options.duration;
}


AudioObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        duration: this.duration,
        created: this.created
    };
}