import jinja2
import os
import webapp2
import urllib, urllib2
import json
import datetime, time

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.api import modules
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import blobstore_handlers
from models import *

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))

class MainPage(webapp2.RequestHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        template = template_env.get_template('home.html')
        context = {
            'upload_url': upload_url,
            'title': "WS Ltd Prototype"
        }
        self.response.out.write(template.render(context))

class FilePage(webapp2.RequestHandler):
    def get(self):
        template = template_env.get_template('files.html')
        context = {
            'title': 'WS Ltd Prototype'
        }
        self.response.out.write(template.render(context))

class FileSend(webapp2.RequestHandler):
    def post(self):
        value = self.request.get("file")
        url = "http://localhost:8080/test"
        form_data = {
            'file': str(value)
        }
        headers = { 'Content-Type': 'multipart/form-data'}
        result = urlfetch.fetch(
            url=url,
            payload=form_data,
            method=urlfetch.POST,
            headers=headers)
        self.response.write(result.content)

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write(upload_url)

    def post(self):
        upload = self.get_uploads()[0]
        value_key = str(upload.key())
        self.response.headers['Content-Type'] = 'application/json'
        response = {
            'blob_key': value_key
        }
        self.response.out.write(json.dumps(response))

class FileHandler(webapp2.RequestHandler):
    def get(self):
        files = FileModel.query()
        serialized_files = [x.get_json() for x in files]

        self.response.headers['Content-Type'] = 'application/json'
        self.response.write(json.dumps(serialized_files))

    def post(self):
        name = self.request.get("name")
        file_type = self.request.get("file_type")
        metadata = self.request.get("metadata")

        if (name is None) or (file_type is None):
            self.error(400)
            return
        
        fileModel = FileModel(name = name,
            file_type = file_type,
            metadata = metadata)

        fileModel.put()

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, file_key):
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)
