var FileModel = function (options) {
    if (options) {
        this.file = options.file || null;
        this.data = options.data || null;
    }

    this.fileObject = null;
}

FileModel.prototype.setData = function (callback) {
    if (this.file && this.fileObject) {
        this.data.name = this.file.name;
        this.data.extension = this.file.name.split(".").slice(-1)[0];

        switch (this.data.file_type) {
            case "image":
                this.setImageData(callback);
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

FileModel.prototype.setImageData = function (callback) {
    this.data.metadata.height = this.fileObject.height;
    this.data.metadata.width = this.fileObject.width;

    callback();
}

FileModel.prototype.setAudioData = function (callback) {
    var that = this;

    this.fileObject.addEventListener("loadedmetadata", function () {
        that.data.metadata.duration = that.fileObject.duration;

        callback();
    });
}

FileModel.prototype.setVideoData = function () {
    var that = this;

    this.fileObject.addEventListener("loadedmetadata", function () {
        that.data.metadata.duration = that.fileObject.duration;

        callback();
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

    this.fileObject = document.createElement(this.data.file_type);

    if (this.data.file_type === "image" && FileReader) {
        var fr = new FileReader(),
            that = this;
        fr.onload = function () {
            switch (that.data.file_type) {
                case "image":
                    that.fileObject.src = fr.result;
                    that.setData();
                    break;
                default:
                    errorCallback("Wrong data format");
            }

            callback(fr.result);
        }
        fr.readAsDataURL(this.file);
    } else {
        var objectUrl = URL.createObjectURL(file);
        this.fileObject.src = objectUrl;
        this.setData(callback);
    }
}