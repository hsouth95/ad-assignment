if (typeof $ === "undefined" && typeof jQuery === "undefined") {
    throw new Error("FileApi requires jQuery");
}

LIST_URL = window.location.protocol + "//" + window.location.host + "/files";

ADD_URL = window.location.protocol + "//" + window.location.host + "/files";

DELETE_URL = window.location.protocol + "//" + window.location.host + "/files";

SHARE_URL = window.location.protocol + "//" + window.location.host + "/share";

EDIT_URL = window.location.protocol + "//" + window.location.host + "/editpage";

var FileApi = function() {};

FileApi.prototype.getFiles = function(e, t, i) {
    var a = this, n = e ? LIST_URL + "?" + e : LIST_URL;
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

FileApi.prototype.deleteFile = function(e, t, i) {
    var a = DELETE_URL + "/" + e;
    $.ajax({
        url: a,
        type: "DELETE",
        contentType: "application/json",
        success: function() {
            t();
        },
        error: function(e) {
            i(e);
        }
    });
};

FileApi.prototype.shareFile = function(e, t, i) {
    var a = SHARE_URL + "/" + e;
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
    var n = ADD_URL + "/" + e;
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
    this.file_type = e.file_type;
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
    this.file_type = e.file_type;
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
    this.file_type = e.file_type;
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

var EditFileFunction = function(e) {
    this.id = e.id;
    this.url = e.url;
    this.name = e.name;
    this.applicableFileTypes = e.fileTypes || null;
    this.applicableExtensions = e.extensions || null;
    this.displayableElement = e.displayableElement || null;
    this.extraData = e.extraData || null;
    this.getUpdatedData = e.getUpdatedData || null;
};

EditFileFunction.prototype.getData = function(e) {
    var t = new FormData(), i = this.getDataUri(e), a = this.dataUrlToBlob(i);
    t.append("file", a);
    if (this.extraData) {
        t = this.extraData(t);
    }
    return t;
};

EditFileFunction.prototype.getDataUri = function(e) {
    var t = document.createElement("canvas");
    t.height = e.naturalHeight;
    t.width = e.naturalWidth;
    t.getContext("2d").drawImage(e, 0, 0);
    return t.toDataURL("image/jpeg");
};

EditFileFunction.prototype.dataUrlToBlob = function(e) {
    var t = e.split(","), i = t[0].match(/:(.*?);/)[1], a = atob(t[1]), n = a.length, o = new Uint8Array(n);
    while (n--) {
        o[n] = a.charCodeAt(n);
    }
    return new Blob([ o ], {
        type: i
    });
};

EditFileFunction.prototype.fire = function(e, t, i) {
    var a = this.getData(e);
    EditFileFunction.prototype.editFile(a, this.url, {
        success: t,
        error: i
    });
};

EditFileFunction.prototype.editFile = function(e, t, i) {
    $.ajax({
        url: t,
        type: i.type || "POST",
        data: e,
        contentType: false,
        processData: false,
        beforeSend: i.beforeSend || null,
        success: i.success || null,
        error: i.error || null,
        complete: i.complete || null
    });
};

EditFileFunction.prototype.replaceImageFile = function(e, t, i) {
    var a = document.createElement("img");
    a.className = "center-block";
    a.id = e;
    a.onload = function() {
        $("#" + e).replaceWith(a);
    };
    a.src = "data:image/" + t + ";base64," + decodeURIComponent(i);
    return a;
};

var EDIT_FUNCTIONS = [ new EditFileFunction({
    id: "watermark",
    url: "/watermark/base64",
    name: "Watermark",
    fileTypes: [ "image" ],
    extensions: [ "jpg" ],
    extraData: function(e) {
        var t = $("#watermark-text").val();
        if (t) {
            e.append("value", t);
        }
        return e;
    },
    displayableElement: function() {
        var e = document.createElement("div"), t = document.createElement("span"), i = document.createElement("button"), a = document.createElement("input");
        e.className = "input-group";
        t.className = "input-group-btn";
        a.id = "watermark-text";
        a.className = "form-control";
        a.type = "text";
        a.placeholder = "Enter watermark text";
        i.innerHTML = this.name;
        i.id = this.id;
        i.className = "btn btn-default file-function";
        i.type = "button";
        t.appendChild(i);
        e.appendChild(a);
        e.appendChild(t);
        return e;
    }
}), new EditFileFunction({
    id: "resize",
    url: "/resize/base64",
    name: "Resize",
    fileTypes: [ "image" ],
    extensions: [ "jpg", "png" ],
    extraData: function(e) {
        var t = $("#resize-height").val(), i = $("#resize-width").val();
        if (t) {
            e.append("height", t);
        }
        if (i) {
            e.append("width", i);
        }
        return e;
    },
    getUpdatedData: function() {
        var e = $("#resize-height").val(), t = $("#resize-width").val(), i = [];
        if (e) {
            i.push({
                name: "metadata-height",
                value: e
            });
        }
        if (e) {
            i.push({
                name: "metadata-width",
                value: t
            });
        }
        return i;
    },
    displayableElement: function() {
        var e = document.createElement("div"), t = document.createElement("span"), i = document.createElement("button"), a = document.createElement("input"), n = document.createElement("input");
        e.className = "input-group";
        t.className = "input-group-btn";
        a.id = "resize-height";
        a.className = "form-control";
        a.type = "text";
        a.placeholder = "Enter file height";
        n.id = "resize-width";
        n.className = "form-control";
        n.type = "text";
        n.placeholder = "Enter file width";
        i.innerHTML = this.name;
        i.id = this.id;
        i.className = "btn btn-default file-function";
        i.type = "button";
        t.appendChild(i);
        e.appendChild(n);
        e.appendChild(a);
        e.appendChild(t);
        return e;
    }
}), new EditFileFunction({
    id: "greyscale",
    url: "/greyscale/base64",
    name: "Greyscale",
    fileTypes: [ "image" ],
    extensions: [ "png", "jpg" ],
    displayableElement: function() {
        var e = document.createElement("button");
        e.innerHTML = this.name;
        e.id = this.id;
        e.className = "btn btn-default file-function";
        e.type = "button";
        return e;
    }
}) ];