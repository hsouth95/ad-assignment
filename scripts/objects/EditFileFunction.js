var EditFileFunction = function(options){
    this.name = options.name;
    this.event = options.event;
    this.applicableFileTypes = options.fileTypes || null;
    this.applicableExtensions = options.extensions || null;
    this.displayableElement = options.displayableElement || null;
}

EditFileFunction.prototype.fire = function(file, extraData, callback){
    this.event(file, extraData, callback);
};

EditFileFunction.prototype.editFile = function(data, url, options){
    $.ajax({
        url: url,
        type: options.type || "POST",
        data: data,
        contentType: false,
        processData: false,
        beforeSend: options.beforeSend || null,
        success: options.success || null,
        error: options.error || null,
        complete: options.complete || null
    });
}

EditFileFunction.prototype.replaceImageFile = function(originalElementId, format, data){
    var updatedImage = document.createElement("img");
        updatedImage.id = originalElementId;
        updatedImage.onload = function() {
            $("#" + originalElementId).replaceWith(updatedImage);
        }
        updatedImage.src = "data:image/" + format + ";base64," + decodeURIComponent(data);
}