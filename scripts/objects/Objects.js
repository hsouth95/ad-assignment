if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requireds jQuery");
}

var FileApi = function(t) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
};

FileApi.prototype.getFiles = function(t, e) {
    var i = this;
    $.ajax({
        url: this.listUrl,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(e) {
            t(i.splitData(e));
        },
        error: function(t) {
            e(t);
        }
    });
};

FileApi.prototype.splitData = function(t) {
    var e = [], i = [], n = [];
    for (var o = 0; o < t.length; o++) {
        switch (t[o].file_type) {
          case "image":
            e.push(new ImageObject(t[o]));
            break;

          case "audio":
            i.push(new AudioObject(t[o]));
            break;

          case "video":
            n.push(new VideoObject(t[o]));
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
    this.duration = t.duration;
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
    this.duration = t.duration;
};

VideoObject.prototype.getDisplayableAttributes = function() {
    return {
        name: this.name,
        extension: this.extension,
        duration: this.duration,
        created: this.created
    };
};