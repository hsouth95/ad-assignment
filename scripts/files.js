$(function(){
    $.ajax({
        url: "/_ah/api/metaapi/v1/files",
        type: "GET",
        success: function(data){
            data.items.forEach(function(item, index){
                displayImage(item);
            });
        },
        error: function(jqXHR, textStatus, errorThrown) {
          console.log(jqXHR, textStatus, errorThrown);
        }
    });

    displayImage = function(data){
        $("#files").append("<div class='pure-u-1-4 pure-u-md-1-4'><div class='media-item'><img src='/download/" + data.blob_key + "'></div></div>");
    }
});
