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
    """Handler for creating a shared file"""
    def post(self, file_id):
        """Creates a Collaboration item to allow sharing of a given file

        Args:
            file_id: The ID of the FileModel that is being shared
        """
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
    """Handler for the various functionalities of the FileModel class"""
    def get(self):
        """Retrieves a list of FileModel's for a given User which satisfies a filter

            Note:
                The filter is optional and is part of the request
        """
        if FileHandler.__file_is_shared(self.request.get("id"), self.request.get("collab_id")) or self.logged_in:
            files = FileHandler.__build_query(self.request)
            
            if self.logged_in:
                user_key = self.current_user.key
                files = files.filter(FileModel.user == str(user_key.id()))
                
            files = files.order(-FileModel.created)

            serialized_files = {}
            serialized_files["files"] = [x.get_json() for x in files]
            self.response.headers['Content-Type'] = 'application/json'
            self.response.headers.add_header("Access-Control-Allow-Origin", "*")
            self.response.write(json.dumps(serialized_files))
        else:
            self.error(401)

    def put(self, file_id):
        """Updates a given FileModel with the data provided

            Args:
                file_id: The ID of the FileModel to Update

            Note:
                The User does not need to be logged in for this, but will require a Collaboration key if not
        """
        file_model = FileModel.get_by_id(long(file_id))
        user = self.current_user if self.logged_in else None
        data = json.loads(self.request.body)
        collab_id = None

        try:
            collab_id = data["collab_id"]
        except KeyError:
            collab_id = None

        if file_model and (FileHandler.__file_is_shared(file_id, collab_id) or (user and file_model.user == str(user.key.id()))):
            try:
                metadata = data["metadata"]
            except AttributeError:
                metadata = None

            file_model = FileHandler.__set_entity_attrs(file_model, data)

            if metadata:
                if file_model.file_type == "image":
                    file_model.image_metadata = FileHandler.__set_entity_attrs(file_model.image_metadata, metadata)
                elif file_model.file_type == "audio":
                    file_model.audio_metadata = FileHandler.__set_entity_attrs(file_model.audio_metadata, metadata)
                elif file_model.file_type == "video":
                    file_model.video_metadata = FileHandler.__set_entity_attrs(file_model.video_metadata, metadata)
            file_model.put()
        else:
            self.response.write("Update not authorised")
            self.error(403)

    def delete(self, file_id):
        """Deletes a given FileModel and its associated File

            Args:
                file_id: The ID of the FileModel to Delete
        """
        file_model = FileModel.get_by_id(long(file_id))
        if file_model and file_model.user == str(self.current_user.key.id()):

            # Find and delete the blob connected to this entity
            blob = blobstore.get(file_model.blob_key)
            if blob:
                blob.delete()

            file_model.key.delete()

    def post(self):
        """Builds and creates a FileModel

            Note:
                Assumes an already created file which will have a valid blob_key
        """
        if self.logged_in:
            data = json.loads(self.request.body)

            name = data["filename"]
            file_type = data["file_type"]
            metadata = data["metadata"]
            blob_key = data["blob_key"]
            extension = data["extension"]
            size = data["size"]

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
                size=int(size),
                user=user
            )

            try:
                file_model = FileHandler.__set_metadata(file_model, metadata)
            except ValueError:
                self.response.write("File metadata was invalid")
                self.error(400)
                return

            file_model.put()
        else:
            self.response.write("Must be logged in")
            self.error(400)

    @staticmethod
    def __set_entity_attrs(entity, data):
        """Updates an Entity based on the attributes of it and the ndb.Model

            Args:
                entity: The ndb.Model that is being updated
                data: The data the entity is being updated with

            Returns:
                The updated Entity provided
        """
        for key in data:
            if hasattr(entity, key):
                attribute = entity._properties[key]
                obj_value = data[key]
                if isinstance(attribute, ndb.IntegerProperty):
                    obj_value = int(obj_value)
                elif isinstance(attribute, ndb.FloatProperty):
                    obj_value = float(obj_value)

                setattr(entity, key, obj_value)

        return entity

    @staticmethod
    def __set_metadata(file_model, metadata):
        """Sets the FileModel Metadata based on the type of Metadata

            Args:
                file_model: The FileModel having the metadata set
                metadata: The Metadata being added to the FileModel

            Returns:
                The updated FileModel
        """
        file_type = file_model.file_type
        if file_type == "image":
            file_model.image_metadata = FileHandler.__get_metadata(metadata, ImageMetadata)
        elif file_type == "audio":
            file_model.audio_metadata = FileHandler.__get_metadata(metadata, AudioMetadata)
        elif file_type == "video":
            file_model.video_metadata = FileHandler.__get_metadata(metadata, VideoMetadata)
        else:
            raise ValueError("'file_type' is not the in the correct range")

        return file_model

    @staticmethod
    def __get_metadata(obj, metadata):
        """Builds the Metadata object from the data provided

            Args:
                obj: The data being read
                metadata: The type of metadata e.g. pass (.., ImageMetadata)

            Returns:
                The populated Metadata
        """
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

    @staticmethod
    def __build_query(request):
        """Builds a ndb query for the FileModel from the parameters given by a request

            Args:
                request: The webapp2 request holding the filter data

            Returns:
                A ndb.Query object to fetch from
        """
        q = FileModel.query()

        if request.get("id") and request.get("id") is not None:
            q = q.filter(FileModel.key == ndb.Key('FileModel', long(request.get("id"))))
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

    @staticmethod
    def __file_is_shared(file_id, collab_id):
        # Check if this update is coming from a shared file
        if collab_id and file_id:
            collab = Collaboration.get_by_id(long(collab_id))
            file_model = FileModel.get_by_id(long(file_id))

            if collab and collab.file_model == file_model.key:
                return True
        
        return False

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler, basehandlers.BaseHandler):
    """Handles the serving of files from the BlobStore"""
    def get(self, file_key):
        """Retrieves the File from the BlobStore

            Args:
                file_key: The BlobKey ID of the File
        """
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)
            return

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler, basehandlers.BaseHandler):
    """Handles the uploading of the Files to the BlobStore"""
    def get(self):
        """Retrieves a URL to allow for uploading to the BlobStore"""
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write(upload_url)

    def post(self):
        """Creates or updates a File in the BlobStore

            Note:
                Will delete the old File in the BlobStore if updated
                because it is impossible to update a File and therefore
                you have to replace it
        """
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


