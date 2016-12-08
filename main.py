import jinja2
import os
import webapp2
import urllib, urllib2
import json

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from google.appengine.api import modules
from google.appengine.api import urlfetch
from google.appengine.ext.webapp import blobstore_handlers

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

class TestClass(webapp2.RequestHandler):
    def post(self):
        if self.request.get("file"):
            self.response.out.write(self.request.get("file"))
        else:
            self.error(404)
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

class FileModel(ndb.Model):
    name = ndb.StringProperty()
    file_type = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)

class FileHandler(webapp2.RequestHandler):
    def get(self):
        files = FileModel.query().fetch(10)

        self.response.write(
            json.dumps(files.to_dict())
        )
    
    def post(self):
        fileModel = FileModel(name="Test",
        file_type="Image")

        fileModel.put()

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, file_key):
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/download/([^/]+)?', DownloadHandler),
                            ('/edit', FileSend),
                            ('/test', TestClass),
                            ('/files', FilePage),
                            ('/getfiles', FileHandler)], debug=True)
