if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requireds jQuery");
}

var FileApi = function(e) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
};

FileApi.prototype.getFiles = function(e, i) {
    var t = this;
    $.ajax({
        url: this.listUrl,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(i) {
            e(t.splitData(i));
        },
        error: function(e) {
            i(e);
        }
    });
};

FileApi.prototype.splitData = function(e) {
    var i = [], t = [], o = [];
    for (var n = 0; n < e.length; n++) {
        switch (e[n].file_type) {
          case "image":
            i.push(new ImageObject(e[n]));
            break;

          case "audio":
            t.push(new AudioObject(e[n]));
            break;

          case "video":
            o.push(new VideoObject(e[n]));
            break;
        }
    }
    return {
        images: i,
        audios: t,
        videos: o
    };
};

var AudioObject = function(e) {
    this.id = e.id;
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
};

var ImageObject = function(e) {
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
};

var VideoObject = function(e) {
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
};