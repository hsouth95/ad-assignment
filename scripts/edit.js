$(function () {
    var fileApi = new FileApi(),
        fileData = null,
        fileMediaUpdated = false;

    getFile = function () {
        var id = fileData ? fileData.id : $("#edit-file").attr("data-id");

        if (id) {
            var filters = "id=" + id;
            fileApi.getFiles(filters, function (data) {
                var file = data[0];
                fileData = file;
                displayFileDetails(file);
            }, function (data) {
                toastr.error("Error getting file");
            })
        }
    }

    setLoading = function (visible) {
        if (visible) {
            $(".loading-block").show();
        } else {
            $(".loading-block").hide();
        }
    }

    displayFileDetails = function (file) {
        var fileAttributes = getFileAttributes(file.getDisplayableAttributes(), "edit-information"),
            fileEditFunctions = getFileEditFunctions(file);

        $.each(fileAttributes, function () {
            $("#edit-information")[0].appendChild(this);
        });

        $.each(fileEditFunctions, function () {
            $("#edit-functions")[0].appendChild(this.displayableElement());
        });

        $(".file-function").click(function (e) {
            editFile(e, file);
        });
    }

    updateSelectedFields = function (data) {
        $.each(data, function () {
            var field = $("#edit-information-" + this.name);

            if (field) {
                field.val(this.value);
            }
        });
    }

    editFile = function (e, file) {
        var editFunction,
            that = e ? e.target : null;

        $.each(EDIT_FUNCTIONS, function () {
            if (this.id === that.id) {
                editFunction = this;
                return false;
            }
        });

        if (editFunction) {
            setButtonLoading(true);
            editFunction.fire(document.getElementById("edit-file"), function (data, updatedData) {
                editFunction.replaceImageFile("edit-file", file.extension, data);
                if (editFunction.getUpdatedData) {
                    updateSelectedFields(editFunction.getUpdatedData());
                }

                fileMediaUpdated = true;
                setButtonLoading(false);
            }, function (data) {
                toastr.error("Failed to apply " + editFunction.name + " to the file.", "Error");
                setButtonLoading(false);
            });
        }
    }

    setButtonLoading = function (isEventFiring) {
        changeButtonDisabled(isEventFiring);
        setLoading(isEventFiring);
    }

    changeButtonDisabled = function (disable) {
        if (disable) {
            $(".file-function").attr("disabled", "true");
            $("#save-btn").attr("disabled", "true");
        } else {
            $(".file-function").removeAttr("disabled");
            $("#save-btn").removeAttr("disabled");
        }
    }

    clearFileInfo = function () {
        $("input").val("");
        $("#edit-information").empty();
        $("#edit-functions").empty();
    }

    getUploadUrl = function (callback) {
        $.ajax({
            url: "/upload",
            type: "GET",
            success: function (data) {
                callback(data);
            }
        });
    }

    getFileAttributes = function (attributes, id) {
        var editInformationAttrs = [];
        for (var attribute in attributes) {
            if (attributes.hasOwnProperty(attribute)) {
                var inputValue = document.createElement("div"),
                    input = attributes[attribute].getInputElement(id),
                    label = attributes[attribute].getLabelElement(id);

                input.className = "form-control";

                inputValue.appendChild(label);
                inputValue.appendChild(input);

                editInformationAttrs.push(inputValue);
            }
        }

        return editInformationAttrs;
    }

    getFileEditFunctions = function (file) {
        var editFunctions = [];
        $.each(EDIT_FUNCTIONS, function () {
            if (!this.applicableFileTypes || this.applicableFileTypes.indexOf(file.file_type) !== -1) {
                if (!this.applicableExtensions || this.applicableExtensions.indexOf(file.extension) !== -1) {
                    editFunctions.push(this);
                }
            }
        });

        return editFunctions;
    }

    getSerializedFormArray = function (element) {
        var disabled = element.find(':input:disabled').removeAttr('disabled');
        var serialized = element.serializeArray();
        disabled.attr('disabled', 'disabled');

        return serialized;
    }
    
    convertFormToJSON = function (form) {
        var array = getSerializedFormArray($(form)),
            json = {},
            isFieldToUpdate = false;
        json.metadata = {};

        $.each(array, function () {
            if (this.value) {
                if (this.name.substr(0, "metadata-".length) === "metadata-") {
                    var attrName = this.name.split("metadata-")[1];
                    json.metadata[attrName] = this.value;
                } else {
                    json[this.name] = this.value || "";
                }

                isFieldToUpdate = true;
            }
        });

        // Only return data if any updates are present
        return isFieldToUpdate ? JSON.stringify(json) : null;
    }

    sendFile = function (file, callback) {
        var dataUrl = EditFileFunction.prototype.getDataUri(file),
            blob = EditFileFunction.prototype.dataUrlToBlob(dataUrl),
            formData = new FormData();

        formData.append("file", blob);
        formData.append("blob_key", fileData.blob_key);

        getUploadUrl(function (url) {
            $.ajax({
                url: url,
                data: formData,
                type: "POST",
                contentType: false,
                processData: false,
                beforeSend: function () {
                    setLoading(true);
                },
                success: function (data) {
                    callback();
                },
                error: function (data) {
                    toastr.error("Failed to uploaded update file with error: " + data, "Error");
                },
                complete: function () {
                    setLoading(false);
                }
            })
        });
    }

    updateFile = function () {
        var form = $("#edit-information"),
            data = convertFormToJSON(form);

        if (data) {
            fileApi.updateFileData(fileData.id, data, function () {
                clearFileInfo();
                setTimeout(function () {
                    getFile();
                    toastr.success("Updated file");
                    setButtonLoading(false);
                }, 1000);
            });
        } else {
            clearFileInfo();
            toastr.success("Updated file");
            getFile();
            setButtonLoading(false);
        }
    }

    $("#save-btn").click(function () {
        var file = document.getElementById("edit-file");
        setButtonLoading(true);
        if (fileMediaUpdated) {
            sendFile(file, updateFile);
        } else {
            updateFile();
        }
    });

    getFile();
});