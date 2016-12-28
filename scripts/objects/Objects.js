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
    var o = this, n = t ? this.listUrl + "?" + t : this.listUrl;
    $.ajax({
        url: n,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(t) {
            e(o.splitData(t.files));
        },
        error: function(t) {
            i(t);
        }
    });
};

FileApi.prototype.shareFile = function(t, e, i) {
    var o = this.shareUrl + "/" + t;
    $.ajax({
        url: o,
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
    var e = [], i = [], o = [];
    for (var n = 0; n < t.length; n++) {
        switch (t[n].file_type) {
          case "image":
            e.push(new ImageObject(t[n]));
            break;

          case "audio":
            i.push(new AudioObject(t[n]));
            break;

          case "video":
            o.push(new VideoObject(t[n]));
            break;
        }
    }
    return {
        images: e,
        audios: i,
        videos: o
    };
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
        duration: this.duration,
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
        height: this.height,
        width: this.width,
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
        duration: this.duration,
        created: this.created
    };
};