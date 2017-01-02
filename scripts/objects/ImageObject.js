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
        name: new Field({
            name: "name",
            value: this.name,
            friendlyName: "Name"
        }),
        extension: new Field({
            name: "extension",
            value: this.extension,
            friendlyName: "File Extension",
            disabled: true,
        }),
        metadata_height: new Field({
            name: "metadata-height",
            value: this.height,
            friendlyName: "Height",
            disabled: true,
            type: "number"
        }), 
        metadata_width: new Field({
            name: "metadata-width",
            value: this.width,
            friendlyName: "Width",
            disabled: true,
            type: "number"
        })
    };
}