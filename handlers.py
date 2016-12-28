import jinja2
import webapp2
import json
import StringIO
import secrets
import base64
import logging
import webob.multidict
import datetime

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.ext.blobstore import BlobKey
from google.appengine.ext.webapp import blobstore_handlers
from google.appengine.api import urlfetch

from PIL import Image, ImageFilter, ImageDraw, ImageFont
from webapp2_extras import auth, sessions
from models import *

from simpleauth import SimpleAuthHandler

LOGOUT_URL = "/logout"
FACEBOOK_AVATAR_URL = 'https://graph.facebook.com/{0}/picture?type=large'

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader("views"))

class BaseHandler(webapp2.RequestHandler):
    USER_ATTRS = {
        'googleplus': {
            'provider': 'google',
            'friendly_name': 'Google',
            'image': lambda img: ('avatar_url', img.get('url', "value")),
            'displayName': 'name',
            'url': 'link'
        },
        'linkedin2': {
            'provider': 'linkedin',
            'friendly_name': 'LinkedIn',
            'picture-url': 'avatar_url',
            'first-name': 'name',
            'public-profile-url': 'link'
        },
        'facebook': {
            'provider': 'facebook',
            'friendly_name': 'Facebook',
            'id': lambda id: ('avatar_url', FACEBOOK_AVATAR_URL.format(id)),
            'name': 'name',
            'link': 'link'
        }
    }


    def dispatch(self):
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        """Returns a session using the default cookie key"""
        return self.session_store.get_session()

    @webapp2.cached_property
    def auth(self):
        return auth.get_auth()

    @webapp2.cached_property
    def current_user(self):
        """Returns currently logged in user"""
        user_dict = self.auth.get_user_by_session()
        return self.auth.store.user_model.get_by_id(user_dict['user_id'])

    @webapp2.cached_property
    def logged_in(self):
        """Returns true if a user is currently logged in, false otherwise"""
        return self.auth.get_user_by_session() is not None
    
    @webapp2.cached_property
    def get_logins(self):
        # Get all logins we can use
        logins = []
        for key, value in self.USER_ATTRS.iteritems():
            logins.append({
                'name': key,
                'provider': value['provider'],
                'friendly_name': value['friendly_name']
            })
        
        # Sort by provider name
        logins = sorted(logins, key=lambda login: login['friendly_name'])
        return logins

class AuthHandler(BaseHandler, SimpleAuthHandler):
    def _on_signin(self, data, auth_info, provider, extra=None):
        auth_id = '%s:%s' % (provider, data['id'])

        user = self.auth.store.user_model.get_by_auth_id(auth_id)
        _attrs = self._to_user_model_attrs(data, self.USER_ATTRS[provider])

        if user:
            user.populate(**_attrs)
            user.put()
            self.auth.set_session(self.auth.store.user_to_dict(user))

        else:
            # check whether there's a user currently logged in
            # then, create a new user if nobody's signed in,
            # otherwise add this auth_id to currently logged in user.

            if self.logged_in:
                u = self.current_user
                u.populate(**_attrs)
                u.add_auth_id(auth_id)

            else:
                ok, user = self.auth.store.user_model.create_user(auth_id, **_attrs)
                if ok:
                    self.auth.set_session(self.auth.store.user_to_dict(user))
      
        destination_url = '/'

        # Check if a destination was specified in the request
        if extra is not None:
            params = webob.multidict.MultiDict(extra)
            destination_url = str(params.get('destination_url', '/'))
        return self.redirect(destination_url)

    def logout(self):
        self.auth.unset_session()
        self.redirect("/")

    def _callback_uri_for(self, provider):
        return self.uri_for('auth_callback', provider=provider, _full=True)

    def _get_consumer_info_for(self, provider):
        return secrets.AUTH_CONFIG[provider]

    def _get_optional_params_for(self, provider):
        """Returns optional parameters for auth init requests."""
        return secrets.AUTH_OPTIONAL_PARAMS.get(provider)

    def _to_user_model_attrs(self, data, attrs_map):
        """Get the needed information from the provider dataset."""
        user_attrs = {}
        for k, v in attrs_map.iteritems():
            attr = (v, data.get(k)) if isinstance(v, str) else v(data.get(k))
            user_attrs.setdefault(*attr)

        return user_attrs

class MainPage(BaseHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        template = template_env.get_template('home.html')

        user = None
        logins = self.get_logins

        if self.logged_in:
            user = self.current_user

        context = {
            'upload_url': upload_url,
            'title': "WS Ltd Prototype",
            'logout_url': LOGOUT_URL,
            'user': user,
            'logins': logins
        }

        self.response.out.write(template.render(context))

class FilePage(BaseHandler):
    def get(self):
        if self.logged_in:
            user = self.current_user

            template = template_env.get_template('files.html')
            context = {
                'title': 'WS Ltd Prototype',
                'logout_url': LOGOUT_URL,
                'user': user
            }
            self.response.out.write(template.render(context))
        else:
            self.redirect("/")

class EditPage(BaseHandler):
    def get(self, id):
        if id:
            collab = Collaboration.get_by_id(long(id))

            if collab:
                file_model_key = collab.file_model
                file_model = file_model_key.get()

                if file_model:
                    user = None
                    # User does not need to be logged in to edit the collaborated file
                    if self.logged_in:
                        user = self.current_user

                    template = template_env.get_template("edit.html")
                    context = {
                        "title": "WS Ltd Prototype",
                        "logout_url": LOGOUT_URL,
                        "user": user,
                        "file_model": file_model 
                    }
                    self.response.write(template.render(context))
                else:
                    self.error(404)

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler, BaseHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write(upload_url)

    def post(self):
        if self.logged_in:
            upload = self.get_uploads()[0]
            value_key = str(upload.key())

            previous_blob_key = self.request.get("blob_key")

            # Check if we are we replacing the file
            if previous_blob_key:
                previous_blob = blobstore.get(BlobKey(previous_blob_key))
                if previous_blob:
                    previous_blob.delete()

                # Retrieve the datastore entity this file belongs to
                files = FileModel.query(FileModel.blob_key == BlobKey(previous_blob_key))
                for file in files:
                    file.blob_key = BlobKey(value_key)
                    file.put()

            self.response.headers['Content-Type'] = 'application/json'
            response = {
                'blob_key': value_key
            }
            self.response.out.write(json.dumps(response))
        else:
            self.error(401)

class ShareHandler(BaseHandler):
    def get(self, id):
        if self.logged_in and id:
            user_key = self.current_user.key

            file_model = FileModel.get_by_id(long(id))

            # Check if key exists and that this user owns the file
            if file_model and file_model.user == str(user_key.id()):
                collab = Collaboration(file_model=file_model.key)

                key = collab.put()

                self.response.write(key.id())
        else:
            self.error(401)

class FileHandler(BaseHandler):
    def get(self):
        if self.logged_in:
            user_key = self.current_user.key

            files = build_query(self.request).filter(FileModel.user == str(user_key.id()))
            serialized_files = [x.get_json() for x in files]

            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(json.dumps(serialized_files))
        else:
            self.error(401)

    def post(self):
        if self.logged_in:

            data = json.loads(self.request.body)

            name = data["filename"]
            file_type = data["file_type"]
            metadata = data["metadata"]
            blob_key = data["blob_key"]
            extension = data["extension"]

            user = str(self.current_user.key.id())

            if name is None or file_type is None or blob_key is None:
                self.error(400)
                return

            fileModel = FileModel(name=name,
                                  file_type=file_type,
                                  blob_key=BlobKey(blob_key),
                                  extension=extension,
                                  user=user)

            if file_type == "image":
                fileModel.image_metadata = get_metadata(metadata, ImageMetadata)
            elif file_type == "audio":
                fileModel.audio_metadata = get_metadata(metadata, AudioMetadata)
            elif file_type == "video":
                fileModel.video_metadata = get_metadata(metadata, VideoMetadata)
            else:
                self.error(400)
                return

            fileModel.put()
        else:
            self.error(400)

class WaterMarkHandler(BaseHandler):
    def post(self, response_type):
        fileValue = None
        fileUrl = None
        
        if self.request.get("file"):
            fileValue = self.request.POST.get("file").file.read()
        elif self.request.get("url"):
            fileUrl = self.request.get("url")
            fileValue = urlfetch.fetch(fileUrl).content
        else:
            self.error(400)
            self.response.write("No image given")
            return
        
        value = self.request.get("value")

        tempBuff = StringIO.StringIO(fileValue)

        im = Image.open(tempBuff)

        if im.format is not "JPEG":
            self.error(400)
            self.response.write("Only JPEG formats are currently supported")
            return

        # Starting font size
        fontsize = 1  

        # Portion of image width text width will be
        img_fraction = 0.40

        # Increment image size until it fills required width of picture
        font = ImageFont.truetype("Promocyja096.ttf", fontsize)
        while font.getsize(value)[0] < img_fraction*im.size[0]:
            # iterate until the text size is just larger than the criteria
            fontsize += 1
            font = ImageFont.truetype("Promocyja096.ttf", fontsize)


        font = ImageFont.truetype("Promocyja096.ttf", fontsize)
        d = ImageDraw.Draw(im)

        d.text((10, 10), value, fill=(255, 255, 255, 128), font=font)

        output = StringIO.StringIO()
        im.save(output, im.format)
        finished_image = output.getvalue()

        # Check to see if image response should be in a particular format
        if response_type:
            if response_type == "base64":
                self.response.write(base64.b64encode(finished_image))
                return
            
        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(finished_image)

def build_query(request):
    """Builds a ndb query for the FileModel from the 
    parameters given by a request
    """
    q = FileModel.query()

    if request.get("id") and request.get("id") is not None:
        q = q.filter(FileModel.id == long(request.get("id")))
        return q
    
    if request.get("name") and request.get("name") is not None:
        # GAE does not have partial string matching so name must be a full match
        q = q.filter(FileModel.name == request.get("name"))
    
    if request.get("extensions") and request.get("extensions") is not None:
        extensions = request.get("extensions").split(",")

        q = q.filter(FileModel.extension.IN([x for x in extensions]))
    
    if request.get("file_types") and request.get("file_types") is not None:
        file_types = request.get("file_types").split(",")

        q = q.filter(FileModel.file_type.IN([x for x in file_types]))

    return q

def get_metadata(obj, metadata):
    if isinstance(obj, dict) is False:
        return None

    attributes = metadata._properties
    value = metadata()

    for attribute in attributes.itervalues():
        if attribute._required and obj.has_key(attribute._name) is False:
            raise ValueError("%s was required but was not present".format(attribute._name))
        elif obj.has_key(attribute._name):
            obj_value = obj[attribute._name]

            if isinstance(attribute, ndb.IntegerProperty):
                obj_value = int(obj_value)
            elif isinstance(attribute, ndb.FloatProperty):
                obj_value = float(obj_value)

            setattr(value, attribute._name, obj_value)

    return value


class MockHandler(BaseHandler):
    def get(self):
        user = self.current_user
        self.response.write(user.key.id())

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler, BaseHandler):
    def get(self, file_key):
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)
            return
