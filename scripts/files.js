$(function () {
    addImage = function (data) {
        $(".grid").append("<img class='item col-md-3 col-sm-6 col-xs-12' src='/download/" + data.blob_key + "'>");
    }

    showImages = function () {
        $(".item").each(function (index) {
            setTimeout(function () {
                $(".item:nth-child(" + index + ")").addClass("is-visible");
            }, 200 * index);
        });
    }

    listItems = function () {
        var url = window.location.protocol + "//" + window.location.host + "/files";
        $.ajax({
            url: url,
            type: "GET",
            dataType: "json",
            contentType: "application/json",
            success: function (data) {
                $.each(data, function () {
                    addImage(this);
                });

                showImages();
            }
        });
    }

    listItems();
});