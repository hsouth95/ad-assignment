var EditFileFunction = function (options) {
    this.id = options.id;
    this.url = options.url;
    this.name = options.name;
    this.applicableFileTypes = options.fileTypes || null;
    this.applicableExtensions = options.extensions || null;
    this.displayableElement = options.displayableElement || null;
    this.extraData = options.extraData || null;
}

EditFileFunction.prototype.getData = function (file) {
    var formData = new FormData();
    dataUrl = this.getDataUri(file),
        blob = this.dataUrlToBlob(dataUrl);

    formData.append("file", blob);

    if (this.extraData) {
        formData = this.extraData(formData);
    }

    return formData;
}

EditFileFunction.prototype.getDataUri = function (file) {
    var canvas = document.createElement("canvas");
    canvas.height = file.naturalHeight;
    canvas.width = file.naturalWidth;

    canvas.getContext("2d").drawImage(file, 0, 0);

    return canvas.toDataURL("image/jpeg");
}

EditFileFunction.prototype.dataUrlToBlob = function (dataUrl) {
    var arr = dataUrl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

EditFileFunction.prototype.fire = function (file, callback, errorCallback) {
    var data = this.getData(file);
    EditFileFunction.prototype.editFile(data, this.url, {
        success: callback,
        error: errorCallback
    });
}

EditFileFunction.prototype.editFile = function (data, url, options) {
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

EditFileFunction.prototype.replaceImageFile = function (originalElementId, format, data) {
    var updatedImage = document.createElement("img");
    updatedImage.id = originalElementId;
    updatedImage.onload = function () {
        $("#" + originalElementId).replaceWith(updatedImage);
    }
    updatedImage.src = "data:image/" + format + ";base64," + decodeURIComponent(data);

    return updatedImage;
}