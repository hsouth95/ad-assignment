import jinja2
import os
import webapp2

from google.appengine.ext import ndb
from google.appengine.api import users
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

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write(upload_url)

        # If the user goes to this URL, redirect them to the main page
        self.redirect('/')

    def post(self):
        try:
            upload = self.get_uploads()[0]
            name = self.request.get("filename")
            photo = File(name=name, blob_key=upload.key())

            photo.put()

            upload_url = blobstore.create_upload_url('/upload')

            self.redirect('/upload')
        except Exception as e:
            self.response.out.write(e.strerror);

class ApiHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self):
        q = File.query()

        values = q.fetch(10)

        if not blobstore.get(values[0].blob_key):
            self.error(404)
        else:
            self.send_blob(values[0].blob_key)

class File(ndb.Model):
    name = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/files', FilePage),
                            ('/test', ApiHandler)], debug=True)
