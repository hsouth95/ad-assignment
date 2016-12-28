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
        name: this.name,
        extension: this.extension,
        duration: this.duration,
        created: this.created
    };
}