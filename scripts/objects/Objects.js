if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requires jQuery");
}

var FileApi = function(t) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
};

FileApi.prototype.getFiles = function(t, e, i) {
    var n = this, a = t ? this.listUrl + "?" + t : this.listUrl;
    $.ajax({
        url: a,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(t) {
            e(n.splitData(t));
        },
        error: function(t) {
            i(t);
        }
    });
};

FileApi.prototype.splitData = function(t) {
    var e = [], i = [], n = [];
    for (var a = 0; a < t.length; a++) {
        switch (t[a].file_type) {
          case "image":
            e.push(new ImageObject(t[a]));
            break;

          case "audio":
            i.push(new AudioObject(t[a]));
            break;

          case "video":
            n.push(new VideoObject(t[a]));
            break;
        }
    }
    return {
        images: e,
        audios: i,
        videos: n
    };
};

var AudioObject = function(t) {
    this.id = t.id;
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
    this.id = t.id;
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