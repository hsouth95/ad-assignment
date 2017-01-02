if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requires jQuery");
}

var FileApi = function (options) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.shareUrl = window.location.protocol + "//" + window.location.host + "/share";
    this.editUrl = window.location.protocol + "//" + window.location.host + "/editpage";
}

FileApi.prototype.getFiles = function (filters, successCallback, errorCallback) {
    var that = this,
        url = filters ? this.listUrl + "?" + filters : this.listUrl;
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function (data) {
            successCallback(that.splitData(data.files));
        },
        error: function (data) {
            errorCallback(data);
        }
    });
}

FileApi.prototype.shareFile = function(id, successCallback, errorCallback) {
    var url = this.shareUrl + "/" + id;
    $.ajax({
        url: url,
        type: "POST",
        contentType: "application/json",
        success: function(data){
            jsonData = JSON.parse(data);
            successCallback(jsonData);
        },
        error: function(data) {
            errorCallback(data);
        }
    });
}

FileApi.prototype.splitData = function (data) {
    var imageObjects = [],
        audioObjects = [],
        videoObjects = [];

    for (var i = 0; i < data.length; i++) {
        switch (data[i].file_type) {
            case "image":
                imageObjects.push(new ImageObject(data[i]));
                break;
            case "audio":
                audioObjects.push(new AudioObject(data[i]));
                break;
            case "video":
                videoObjects.push(new VideoObject(data[i]));
                break;
        }
    }

    return {
        images: imageObjects,
        audios: audioObjects,
        videos: videoObjects
    };
}

FileApi.prototype.updateFileData = function(id, data, successCallback, errorCallback) {
    var url = this.addUrl + "/" + id;
    $.ajax({
        url: url,
        type: "PUT",
        data: data,
        contentType: "application/json",
        success: function(data){
            successCallback(data);
        }, 
        error: function(data) {
            errorCallback(data);
        }
    });
}