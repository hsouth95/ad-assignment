var FileModel = function (options) {
    if (options) {
        this.file = options.file || null;
        this.data = options.data || null;
    }

    this.fileObject = null;
}

FileModel.prototype.setData = function (url, callback) {
    if (this.file && this.fileObject) {
        this.data.name = this.file.name;
        this.data.extension = this.file.name.split(".").slice(-1)[0];
        this.data.size = this.file.size;

        switch (this.data.file_type) {
            case "image":
                this.setImageData(url, callback);
                break;
            case "audio":
                this.setAudioData(callback);
                break;
            case "video":
                this.setVideoData(callback);
                break;
        }
    }
}

FileModel.prototype.setImageData = function (url, callback) {
    var that = this;

    this.fileObject.addEventListener("load", function () {
        that.data.metadata.height = that.fileObject.height;
        that.data.metadata.width = that.fileObject.width;

        if (callback && typeof callback === "function") {
            callback();
        }
    });

    this.fileObject.src = url;
}

FileModel.prototype.setAudioData = function (callback) {
    var that = this;

    this.fileObject.addEventListener("loadedmetadata", function () {
        that.data.metadata.duration = that.fileObject.duration;

        if (callback && typeof callback === "function") {
            callback();
        }
    });
}

FileModel.prototype.setVideoData = function (callback) {
    var that = this;

    this.fileObject.addEventListener("loadedmetadata", function () {
        that.data.metadata.duration = that.fileObject.duration;

        if (callback && typeof callback === "function") {
            callback();
        }
    });
}

FileModel.prototype.setFileType = function (callback, errorCallback) {
    if (this.file) {
        var imgRegex = /^image\//,
            audioRegex = /^audio\//,
            videoRegex = /^video\//,
            file_type = "";

        if (imgRegex.test(this.file.type)) {
            file_type = "image";
        } else if (audioRegex.test(this.file.type)) {
            file_type = "audio";
        } else if (videoRegex.test(this.file.type)) {
            file_type = "video";
        } else {
            errorCallback("Bad file type");
            return;
        }

        if (!this.data) {
            this.data = {};
            this.data.metadata = {};
        }

        this.data.file_type = file_type;

        if (callback && typeof callback === "function") {
            callback(file_type);
        }
    } else {
        errorCallback("No file specified");
    }
}

FileModel.prototype.parseFile = function (file, callback, errorCallback) {
    this.file = this.file ? this.file : file;

    if (!this.data || !this.data.file_type) {
        this.setFileType();
    }

    var objectUrl = URL.createObjectURL(file);

    if (this.data.file_type === "image") {
        this.fileObject = document.createElement("img");
        this.fileObject.id = "uploading-file";
        this.setData(objectUrl, callback);
    } else {
        this.fileObject = document.createElement(this.data.file_type);
        this.fileObject.id = "uploading-file";
        this.fileObject.src = objectUrl;
        this.setData(null, callback);
    }
}