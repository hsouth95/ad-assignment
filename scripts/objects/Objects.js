if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requires jQuery");
}

var FileApi = function(e) {
    this.listUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.addUrl = window.location.protocol + "//" + window.location.host + "/files";
    this.shareUrl = window.location.protocol + "//" + window.location.host + "/share";
    this.editUrl = window.location.protocol + "//" + window.location.host + "/editpage";
};

FileApi.prototype.getFiles = function(e, t, i) {
    var a = this, n = e ? this.listUrl + "?" + e : this.listUrl;
    $.ajax({
        url: n,
        type: "GET",
        dataType: "json",
        contentType: "application/json",
        success: function(e) {
            t(a.splitData(e.files));
        },
        error: function(e) {
            i(e);
        }
    });
};

FileApi.prototype.shareFile = function(e, t, i) {
    var a = this.shareUrl + "/" + e;
    $.ajax({
        url: a,
        type: "POST",
        contentType: "application/json",
        success: function(e) {
            jsonData = JSON.parse(e);
            t(jsonData);
        },
        error: function(e) {
            i(e);
        }
    });
};

FileApi.prototype.splitData = function(e) {
    var t = [];
    for (var i = 0; i < e.length; i++) {
        switch (e[i].file_type) {
          case "image":
            t.push(new ImageObject(e[i]));
            break;

          case "audio":
            t.push(new AudioObject(e[i]));
            break;

          case "video":
            t.push(new VideoObject(e[i]));
            break;
        }
    }
    return t;
};

FileApi.prototype.updateFileData = function(e, t, i, a) {
    var n = this.addUrl + "/" + e;
    $.ajax({
        url: n,
        type: "PUT",
        data: t,
        contentType: "application/json",
        success: function(e) {
            i(e);
        },
        error: function(e) {
            a(e);
        }
    });
};

var Field = function(e) {
    this.name = e.name;
    this.initialValue = e.value || null;
    this.type = e.type || "text";
    this.disabled = e.disabled || false;
    this.friendlyName = e.friendlyName || null;
};

Field.prototype.getLabelElement = function(e) {
    var t = document.createElement("label");
    t.innerHTML = this.friendlyName || this.name.charAt(0).toUpperCase() + this.name.splice(1);
    t.for = e ? e + "-" + this.name : this.name;
    return t;
};

Field.prototype.getInputElement = function(e) {
    var t = document.createElement("input");
    t.name = this.name;
    t.placeholder = this.initialValue;
    t.type = this.type;
    t.disabled = this.disabled;
    t.id = e ? e + "-" + this.name : this.name;
    return t;
};

var AudioObject = function(e) {
    this.id = e.key;
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
    this.duration = e.audio_metadata.duration;
    this.created = e.created;
};

AudioObject.prototype.getDisplayableAttributes = function() {
    return {
        name: new Field({
            name: "name",
            value: this.name,
            friendlyName: "Name"
        }),
        extension: new Field({
            name: "extension",
            value: this.extension,
            friendlyName: "File Extension",
            disabled: true
        }),
        metadata_duration: new Field({
            name: "metadata-duration",
            value: this.duration,
            friendlyName: "Duration",
            disabled: true
        })
    };
};

var ImageObject = function(e) {
    this.id = e.key;
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
    this.height = e.image_metadata.height;
    this.width = e.image_metadata.width;
    this.created = new Date(e.created);
    this.tags = e.tags;
};

ImageObject.prototype.getDisplayableAttributes = function() {
    return {
        name: new Field({
            name: "name",
            value: this.name,
            friendlyName: "Name"
        }),
        extension: new Field({
            name: "extension",
            value: this.extension,
            friendlyName: "File Extension",
            disabled: true
        }),
        metadata_height: new Field({
            name: "metadata-height",
            value: this.height,
            friendlyName: "Height",
            disabled: true,
            type: "number"
        }),
        metadata_width: new Field({
            name: "metadata-width",
            value: this.width,
            friendlyName: "Width",
            disabled: true,
            type: "number"
        })
    };
};

var VideoObject = function(e) {
    this.id = e.key;
    this.blob_key = e.blob_key;
    this.name = e.name;
    this.extension = e.extension;
    this.duration = e.video_metadata.duration;
    this.created = e.created;
};

VideoObject.prototype.getDisplayableAttributes = function() {
    return {
        name: new Field({
            name: "name",
            value: this.name,
            friendlyName: "Name"
        }),
        extension: new Field({
            name: "extension",
            value: this.extension,
            friendlyName: "File Extension",
            disabled: true
        }),
        metadata_duration: new Field({
            name: "metadata-duration",
            value: this.duration,
            friendlyName: "Duration",
            disabled: true
        })
    };
};