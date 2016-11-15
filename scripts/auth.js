// Set global namespace
var harrison = harrison || {};

harrison.assignment = harrison.assignment || {};

harrison.assignment.auth = harrison.assignment.auth || {};

harrison.assignment.auth.CLIENT_ID =
    "CLIENT_ID";

harrison.assignment.auth.SCOPE =
    "https://www.googleapis.com/auth/userinfo.email";

harrison.assignment.auth.API_ROOT =
    "//" + window.location.host + "/_ah/api";

harrison.assignment.auth.signedIn = false;

harrison.assignment.auth.initalAuthCallbacks;

harrison.assignment.auth.authorize = function(mode, callback) {
    gapi.auth.authorize({
        client_id: harrison.assignment.auth.CLIENT_ID,
        scope: harrison.assignment.auth.SCOPE,
        immediate: mode},
        callback);
}

harrison.assignment.auth.isUserAuthed = function() {
    gapi.client.oauth2.userinfo.get().execute(function(resp) {
        if (!resp.code) {
            harrison.assignment.auth.signedIn = true;
        } else {
            harrison.assignment.auth.signedIn = false;
        }

        var callbacks = harrison.assignment.auth.initalAuthCallbacks;
        if(callbacks && callbacks.length > 0) {
            for(var i = 0, len = callbacks.length; i < len; i++){
                callbacks[i]();
            }
        } else {
            console.warn("No initial callback function is set for authentication");
        }
    });
}

harrison.assignment.auth.signOut = function(callback){
    if(harrison.assignment.auth.signedIn){
        gapi.auth.setToken(null);
        harrison.assignment.auth.signedIn = false;
        if(callback && typeof callback === "function"){
            callback();
        }
    }
}

harrison.assignment.auth.signIn = function(callback) {
    if(!harrison.assignment.auth.signedIn){
        harrison.assignment.auth.authorize(false, callback);
    }
}

harrison.assignment.auth.init = function() {
    var apisToLoad,
        callback = function() {
        if (--apisToLoad == 0) {
            harrison.assignment.auth.authorize(true, harrison.assignment.auth.isUserAuthed);
        }
    }

    // Must match number of calls to gapi.client.load()
    apisToLoad = 2;

    gapi.client.load('metaapi', 'v1', callback, harrison.assignment.auth.API_ROOT);
    gapi.client.load('oauth2', 'v2', callback);
}
