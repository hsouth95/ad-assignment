import jinja2
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.api import users
from google.appengine.ext import blobstore
from google.appengine.ext.webapp import blobstore_handlers

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))

class MainPage(webapp2.RequestHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        template = template_env.get_template('home.html')
        context = {
            'upload_url': upload_url
        }
        self.response.out.write(template.render(context))

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def post(self):
        try:
            upload = self.get_uploads()[0]
            name = self.request.get("filename")
            photo = UserPhoto(name=name, blob_key=upload.key())

            photo.put()
        except:
            self.error(500)

class UserPhoto(ndb.Model):
    name = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()

app = webapp2.WSGIApplication([('/', MainPage),('/upload', UploadHandler)], debug=True)
