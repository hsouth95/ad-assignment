import jinja2
import webapp2
import json
import datetime
import logging

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.ext.blobstore import BlobKey
from google.appengine.ext.webapp import blobstore_handlers
import basehandlers
from models import *

class ShareHandler(basehandlers.BaseHandler):
    def post(self, file_id):
        if self.logged_in and file_id:
            user_key = self.current_user.key

            file_model = FileModel.get_by_id(long(file_id))

            # Check if key exists and that this user owns the file
            if file_model and file_model.user == str(user_key.id()):
                collab = Collaboration(file_model=file_model.key)

                key = collab.put()

                self.response.write(json.dumps({"id": key.id()}))
        else:
            self.error(401)

class FileHandler(basehandlers.BaseHandler):
    def get(self):
        if self.logged_in:
            user_key = self.current_user.key

            files = build_query(self.request).filter(FileModel.user == str(user_key.id()))

            serialized_files = {}
            serialized_files["files"] = [x.get_json() for x in files]
            self.response.headers['Content-Type'] = 'application/json'
            self.response.write(json.dumps(serialized_files))
        else:
            self.error(401)
    
    def put(self, file_id):
        file_model = FileModel.get_by_id(long(file_id))
        if file_model and file_model.user == str(self.current_user.key.id()):
            data = json.loads(self.request.body)
            metadata = data["metadata"] if hasattr(data, "metadata") else None
            
            if metadata:
                del data["metadata"]

            file_model = self.__set_entity_attrs(file_model, data)

            if metadata:
                self.response.write("2")
                if file_model.file_type is "image":
                    file_model.image_metadata = self.__set_entity_attrs(file_model.image_metadata, metadata)
                elif file_model.file_type is "audio":
                    file_model.audio_metadata = self.__set_entity_attrs(file_model.audio_metadata, metadata)
                elif file_model.file_type is "video":
                    file_model.video_metadata = self.__set_entity_attrs(file_model.video_metadata, metadata)
            
            file_model.put()

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
                self.response.write("Required fields were not supplied")
                self.error(400)
                return

            file_model = FileModel(
                name=name,
                file_type=file_type,
                blob_key=BlobKey(blob_key),
                extension=extension,
                user=user
            )

            try:
                file_model = self.__set_metadata(file_model, metadata)
            except ValueError:
                self.response.write("File metadata was invalid")
                self.error(400)
                return
            
            file_model.put()
        else:
            self.response.write("Must be logged in")
            self.error(400)

    def __set_entity_attrs(self, entity, data):
        for key in data:
            if hasattr(entity, key):
                setattr(entity, key, data[key])
            
        return entity

    def __set_metadata(self, file_model, metadata):
        file_type = file_model.file_type
        if file_type == "image":
            file_model.image_metadata = self.__get_metadata(metadata, ImageMetadata)
        elif file_type == "audio":
            file_model.audio_metadata = self.__get_metadata(metadata, AudioMetadata)
        elif file_type == "video":
            file_model.video_metadata = self.__get_metadata(metadata, VideoMetadata)
        else:
            raise ValueError("'file_type' is not the in the correct range")

        return file_model

    def __get_metadata(self, obj, metadata):
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

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler, basehandlers.BaseHandler):
    def get(self, file_key):
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)
            return

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler, basehandlers.BaseHandler):
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
                for file_model in files:
                    file_model.blob_key = BlobKey(value_key)
                    file_model.put()

            self.response.headers['Content-Type'] = 'application/json'
            response = {
                'blob_key': value_key
            }
            self.response.out.write(json.dumps(response))
        else:
            self.error(401)
