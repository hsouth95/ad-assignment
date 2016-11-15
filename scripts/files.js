displayImage = function(data){
    $("#files").append("<div class='col-lg-4 col-sm-6'><div class='media-item'><img src='/download/" + data.blob_key + "'></div></div>");
}

function listItems(){
    gapi.client.metaapi.file.list().execute(function(resp){
        $.each(resp.items, function(){
            displayImage(this);
        })
    });
}
