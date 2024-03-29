$(function () {
    var fileSelected = false,
        loadingIcon = "<div class='spinner'><div class='double-bounce1'></div><div class='double-bounce2'></div></div>",
        uploadingFile = new FileModel();

    /**
     * A function to handle the picking of a file
     * @param {Object} evt - The file picking event e.g. drag, pick
     */
    pickFile = function (evt) {
        var target = evt.dataTransfer || evt.target || window.event.srcElement,
            files = target.files;

        setLoading();
        handleFileType(files[0]);
    }

    /** Indicates to the user that something is loading */
    setLoading = function () {
        $(".drag-n-drop-content").html(loadingIcon);
    }

    /**
     * Chooses a different handler for each file type e.g. Audio, Image
     * @param {File} file - The file that is being uploaded
     */
    handleFileType = function (file) {
        uploadingFile.parseFile(file, function () {
            $(".drag-n-drop-overlay").removeClass("pointer");
            $("#submit").removeAttr("disabled");

            switch (uploadingFile.data.file_type) {
                case "image":
                    appendImage();
                    break;
                case "audio":
                    appendAudio();
                    break;
                case "video":
                    appendVideo();
                    break;
            }

            populateInformation();
        },
            function (message) {
                toastr.error("Failed to parse the uploading file with error: " + message, "Error");
                resetForm(false);
            });
    }

    /**
     * Displays the image in the upload box
     * @param {string} imageUrl - The url of the image to be displayed
     */
    appendImage = function () {
        $(".drag-n-drop-content").html(uploadingFile.fileObject);
        $(".drag-n-drop-overlay").removeClass("pointer");
        $("#submit").removeAttr("disabled");
    }

    appendAudio = function (audioUrl) {
        uploadingFile.fileObject.controls = true;
        $(".drag-n-drop-content").html(uploadingFile.fileObject);
    }

    appendVideo = function (vidoeUrl) {
        uploadingFile.fileObject.controls = true;
        $(".drag-n-drop-content").html(uploadingFile.fileObject);
    }

    populateInformation = function () {
        var name = uploadingFile.data.name,
            extension = uploadingFile.data.name.split(".").slice(-1)[0];

        addField("filename", "File Name", "text", name.substr(0, name.length - (extension.length + 1)));

        for (var attribute in uploadingFile.data) {
            if (uploadingFile.data.hasOwnProperty(attribute) &&
                attribute !== "name" &&
                attribute !== "metadata") {
                addField(attribute, attribute, "text", uploadingFile.data[attribute]);
            }
        }

        for (var metaAttribute in uploadingFile.data.metadata) {
            if (uploadingFile.data.metadata.hasOwnProperty(metaAttribute)) {
                addField("metadata-" + metaAttribute,
                    metaAttribute,
                    "text",
                    uploadingFile.data.metadata[metaAttribute]);
            }
        }

        getServiceAttrs();
    }

    getServiceAttrs = function () {
        var formData = new FormData($("#file-form")[0]);

        switch (uploadingFile.data.file_type) {
            case "image":
                getAuthor(formData);
                break;
            case "audio":
                break;
            case "video":
                break;
        }
    }

    /**
     * Creates an input field inside the upload form
     * @param {string} name - The name of the input field
     * @param {string} labelText - The text in the input field to be displayed
     * @param {string} type - The type of the input field
     * @param {integer} value - The value inside the field
     */
    addField = function (name, labelText, type, value) {
        var inputElement = document.createElement("input"),
            labelElement = document.createElement("label");

        if ($("input[name=" + name + "]").length === 0) {
            inputElement.name = name;
            inputElement.id = name;
            inputElement.type = type;
            inputElement.className = "form-control";
            inputElement.placeholder = labelText;

            labelElement.htmlFor = name;
            labelElement.innerHTML = labelText;

            if (value) {
                inputElement.value = value;
            }

            $("#file-form #fieldset").append(labelElement, inputElement);

            return true;
        } else {
            return false;
        }
    }

    /**
     * Resets the form to allow for additional uploads
     * @param {boolean} success - Indicates if we're resetting because of a successful upload
     */
    resetForm = function (success) {
        $("input[type=text],input[type=number]").remove();
        $("label").remove();
        $("#file-form")[0].reset();
        $("#submit").attr("disabled", "true");

        $(".drag-n-drop-overlay").addClass("pointer");

        if (success) {
            $(".drag-n-drop-content").html("<i class='fa fa-upload' aria-hidden='true'></i>&nbsp;Pick a file to upload.");
            setUploadUrl(true);
        } else {
            $(".drag-n-drop-content").html("Opps! Something went wrong, please try again.");
        }
    }

    /**
     * Sets the upload url of the file uploader
     * @param {boolean} isSync - States if the request should be fired synchronously
     */
    setUploadUrl = function (isSync) {
        $.ajax({
            url: "/upload",
            type: "GET",
            async: !isSync,
            success: function (data) {
                $("#file-form").attr("action", data);
            }
        });
    }

    /** Asynchronously uploads the file and the fields to the server */
    submitForm = function () {
        var url = $("#file-form").attr("action");

        // To allow for async file uploads we require FormData, IE 9 does not use this
        if (typeof FormData !== "undefined") {
            var formData = new FormData($("#file-form")[0]);
            $.ajax({
                url: url,
                type: "POST",
                data: formData,
                beforeSend: function () {
                    setLoading();
                },
                processData: false,
                contentType: false,
                success: function (data) {
                    postFileData(data.blob_key);
                },
                error: function (data) {
                    toastr.error("Failed to upload the file to the server.", "Error");
                }
            });
        }
    }

    convertFormToJSON = function (form) {
        var array = $(form).serializeArray(),
            json = {};

        json.metadata = {};

        $.each(array, function () {
            if (this.name.substr(0, "metadata-".length) === "metadata-") {
                var attrName = this.name.split("metadata-")[1];
                json.metadata[attrName] = this.value;
            } else {
                json[this.name] = this.value || "";
            }
        });

        return json;
    }

    postFileData = function (blob_key) {
        var url = window.location.protocol + "//" + window.location.host + "/files";

        var json = convertFormToJSON("#file-form");
        json.blob_key = blob_key;
        $.ajax({
            url: url,
            type: "POST",
            data: JSON.stringify(json),
            contentType: "application/json",
            processData: false,
            success: function (data) {
                setUploadUrl(true);
                resetForm(true);
                toastr.success("File uploaded successfully!", "Success");
            },
            error: function (data) {
                toastr.error("Failed to upload the file data to the server", "Error");
                resetForm(false);
            }
        });
    }

    getAuthor = function (formData, callback) {
        var url = "https://ws-media.appspot.com/photo/photometadata";
        $.ajax({
            url: url,
            type: "POST",
            data: formData,
            contentType: false,
            processData: false,
            crossDomain: true,
            success: function (data) {
                if (data !== "Unable to derive data from the given file") {
                    alert(data);
                    if (typeof callback === "function") {
                        callback();
                    }
                } else {
                    toastr.warning("No camera details on file");
                }
            },
            error: function (data) {
                toastr.warning("Error finding camera details");
            }
        });
    }

    $("#file-picker-button").on("click", function () {
        if (!fileSelected) {
            $("#file-picker").trigger("click");
        }
    });

    $("#submit").on("click", function (e) {
        e = e || window.event;

        // If the FormData object does not exist then we have to synchronously upload the file
        // therefore we rely on the form action
        if (e.preventDefault && typeof FormData !== "undefined") {
            e.preventDefault();
            submitForm();
        }
    });

    $("#file-picker").on("change", pickFile);

    /*
     * To prevent DDOS attempts, Google has a 10-minute limit on the upload URL
     * therefore every 9 minutes we request a new URL.
     * SEE: https://groups.google.com/forum/#!topic/google-appengine/55__MQ61EO0
     */
    setInterval(setUploadUrl, 1000 * 60 * 9);
});
