var ImageObject = function(options) {
    this.id = options.key;
    this.blob_key = options.blob_key;
    this.name = options.name;
    this.extension = options.extension;
    this.height = options.image_metadata.height;
    this.width = options.image_metadata.width;
    this.created = new Date(options.created);
    this.tags = options.tags;
}

ImageObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        height: this.height,
        width: this.width,
        created: this.created
    };
}