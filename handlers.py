import jinja2
import os
import webapp2
import json
import datetime, time
import StringIO
import secrets
import webob.multidict
import logging
from PIL import Image, ImageFilter, ImageDraw, ImageFont

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.ext.blobstore import BlobKey
from google.appengine.ext.webapp import blobstore_handlers

from webapp2_extras import auth, sessions
from models import *

from simpleauth import SimpleAuthHandler

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader("views"))

class BaseHandler(webapp2.RequestHandler):
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

class AuthHandler(BaseHandler, SimpleAuthHandler):
    USER_ATTRS = {
        'googleplus': {
            'image': lambda img: ('avatar_url', img.get('url', "value")),
            'displayName': 'name',
            'url': 'link'
        }
    }

    def _on_signin(self, data, auth_info, provider, extra=None):
        auth_id = '%s:%s' % (provider, data['id'])

        logging.debug('Looking for a user with id %s', auth_id)
        user = self.auth.store.user_model.get_by_auth_id(auth_id)
        _attrs = self._to_user_model_attrs(data, self.USER_ATTRS[provider])

        if user:
            logging.debug('Found existing user to log in')
            # Existing users might've changed their profile data so we update our
            # local model anyway. This might result in quite inefficient usage
            # of the Datastore, but we do this anyway for demo purposes.
            #
            # In a real app you could compare _attrs with user's properties fetched
            # from the datastore and update local user in case something's changed.
            user.populate(**_attrs)
            user.put()
            self.auth.set_session(self.auth.store.user_to_dict(user))

        else:
            # check whether there's a user currently logged in
            # then, create a new user if nobody's signed in,
            # otherwise add this auth_id to currently logged in user.

            if self.logged_in:
                logging.debug('Updating currently logged in user')

                u = self.current_user
                u.populate(**_attrs)
                # The following will also do u.put(). Though, in a real app
                # you might want to check the result, which is
                # (boolean, info) tuple where boolean == True indicates success
                # See webapp2_extras.appengine.auth.models.User for details.
                u.add_auth_id(auth_id)

            else:
                logging.debug('Creating a brand new user')
                ok, user = self.auth.store.user_model.create_user(auth_id, **_attrs)
                if ok:
                    self.auth.set_session(self.auth.store.user_to_dict(user))

        # Remember auth data during redirect, just for this demo. You wouldn't
        # normally do this.
        self.session.add_flash(auth_info, 'auth_info')
        self.session.add_flash({'extra': extra}, 'extra')

        # user profile page
        destination_url = '/profile'
        if extra is not None:
            params = webob.multidict.MultiDict(extra)
            destination_url = str(params.get('destination_url', '/profile'))
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
        context = {
            'upload_url': upload_url,
            'title': "WS Ltd Prototype"
        }
        self.response.out.write(template.render(context))

class FilePage(BaseHandler):
    def get(self):
        if self.logged_in:
            template = template_env.get_template('files.html')
            context = {
                'title': 'WS Ltd Prototype'
            }
            self.response.out.write(template.render(context))
        else:
            self.redirect("/")

class UploadHandler(BaseHandler):
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
            self.error(403)

class FileHandler(BaseHandler):
    def get(self):
        if self.logged_in:
            files = FileModel.query()
            serialized_files = [x.get_json() for x in files]

            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(json.dumps(serialized_files))
        else:
            self.error(403)

    def post(self):
        if self.logged_in:

            data = json.loads(self.request.body)
            
            name = data["filename"]
            file_type = data["file_type"]
            metadata = data["metadata"]
            blob_key = data["blob_key"]
            extension = data["extension"]

            if name is None or file_type is None or blob_key is None:
                self.error(400)
                return

            fileModel = FileModel(name = name,
                file_type = file_type,
                blob_key = BlobKey(blob_key),
                extension = extension)

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

class AppleHandler(BaseHandler):
    def get(self):
        if self.logged_in:
            self.response.write("in!")
        else:
            self.response.write("out!")

class EditImageHandler(BaseHandler):
    def post(self):
        file = self.request.POST.multi["file"].file.read()
        value = self.request.get("value")

        tempBuff = StringIO.StringIO(apple)

        im = Image.open(tempBuff)
        draw = ImageDraw.Draw(im)
        font = ImageFont.truetype("Promocyja096.ttf", 20, encoding="utf-8")
        draw.text((0, 0), value, font=font)
        
        output = StringIO.StringIO()

        im.save(output, "jpeg")
        text_layer = output.getvalue()
        self.response.headers["Content-Type"] = "image/jpeg"
        self.response.write(text_layer)


class WaterMarkHandler(BaseHandler):
    def post(self):
        file = self.request.POST.multi["file"].file.read()
        value = self.request.get("value")

        tempBuff = StringIO.StringIO(file)

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
        text_layer = output.getvalue()

        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(text_layer)

def get_metadata(obj, metadata):
    if isinstance(obj, dict) == False:
        return None

    attributes = metadata._properties
    value = metadata()

    for attribute in attributes.itervalues():
        if attribute._required and obj.has_key(attribute._name) == False:
            raise ValueError("%s was required but was not present".format(attribute._name))
        elif obj.has_key(attribute._name):
            obj_value = obj[attribute._name]

            if isinstance(attribute, ndb.IntegerProperty):
                obj_value = int(obj_value)
            elif isinstance(attribute, ndb.FloatProperty):
                obj_value = float(obj_value)
        
            setattr(value, attribute._name, obj_value)
    
    return value
    
class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler, BaseHandler):
    def get(self, file_key):
        if self.logged_in:
            if not blobstore.get(file_key):
                self.error(404)
            else:
                self.send_blob(file_key)
        else:
            self.error(403)
