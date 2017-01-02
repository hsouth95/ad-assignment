var AudioObject = function(options) {
    this.id = options.key;
    this.blob_key = options.blob_key;
    this.name = options.name;
    this.extension = options.extension;
    this.duration = options.audio_metadata.duration;
    this.created = options.created;
}


AudioObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        metadata_duration: this.duration,
        created: this.created
    };
}