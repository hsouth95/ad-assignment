var VideoObject = function(options) {
    this.id = options.key;
    this.blob_key = options.blob_key;
    this.name = options.name;
    this.extension = options.extension;
    this.duration = options.video_metadata.duration;
    this.created = options.created;
}

VideoObject.prototype.getDisplayableAttributes = function() {
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
        metadata_duration: new Field({
            name: "metadata-duration",
            value: this.duration,
            friendlyName: "Duration",
            disabled: true,
        })
    };
}