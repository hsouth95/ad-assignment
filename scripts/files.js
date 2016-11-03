$(function(){
    $.ajax({
        url: "/_ah/api/metaapi/v1/files?limit=9",
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
        $("#files").append("<div class='col-lg-4 col-sm-6'><div class='media-item'><img src='/download/" + data.blob_key + "'></div></div>");
    }
});
