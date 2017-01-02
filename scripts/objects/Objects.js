if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requires jQuery");
}

var FileApi = function(t) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.shareUrl = window.location.protocol + "//" + window.location.host + "/share";
    this.editUrl = window.location.protocol + "//" + window.location.host + "/editpage";
};

FileApi.prototype.getFiles = function(t, e, i) {
    var a = this, o = t ? this.listUrl + "?" + t : this.listUrl;
    $.ajax({
        url: o,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(t) {
            e(a.splitData(t.files));
        },
        error: function(t) {
            i(t);
        }
    });
};

FileApi.prototype.shareFile = function(t, e, i) {
    var a = this.shareUrl + "/" + t;
    $.ajax({
        url: a,
        type: "POST",
        contentType: "application/json",
        success: function(t) {
            jsonData = JSON.parse(t);
            e(jsonData);
        },
        error: function(t) {
            i(t);
        }
    });
};

FileApi.prototype.splitData = function(t) {
    var e = [], i = [], a = [];
    for (var o = 0; o < t.length; o++) {
        switch (t[o].file_type) {
          case "image":
            e.push(new ImageObject(t[o]));
            break;

          case "audio":
            i.push(new AudioObject(t[o]));
            break;

          case "video":
            a.push(new VideoObject(t[o]));
            break;
        }
    }
    return {
        images: e,
        audios: i,
        videos: a
    };
};

FileApi.prototype.updateFileData = function(t, e, i, a) {
    var o = this.addUrl + "/" + t;
    $.ajax({
        url: o,
        type: "PUT",
        data: e,
        contentType: "application/json",
        success: function(t) {
            i(t);
        },
        error: function(t) {
            a(t);
        }
    });
};

var AudioObject = function(t) {
    this.id = t.key;
    this.blob_key = t.blob_key;
    this.name = t.name;
    this.extension = t.extension;
    this.duration = t.audio_metadata.duration;
    this.created = t.created;
};

AudioObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        metadata_duration: this.duration,
        created: this.created
    };
};

var ImageObject = function(t) {
    this.id = t.key;
    this.blob_key = t.blob_key;
    this.name = t.name;
    this.extension = t.extension;
    this.height = t.image_metadata.height;
    this.width = t.image_metadata.width;
    this.created = new Date(t.created);
    this.tags = t.tags;
};

ImageObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        metadata_height: this.height,
        metadata_width: this.width,
        created: this.created
    };
};

var VideoObject = function(t) {
    this.id = t.key;
    this.blob_key = t.blob_key;
    this.name = t.name;
    this.extension = t.extension;
    this.duration = t.video_metadata.duration;
    this.created = t.created;
};

VideoObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        metadata_duration: this.duration,
        created: this.created
    };
};