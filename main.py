import jinja2
import os
import webapp2
import urllib
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

class UploadHandler(blobstore_handlers.BlobstoreUploadHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        self.response.out.write(upload_url)

        # If the user goes to this URL, redirect them to the main page
        self.redirect('/')

    def post(self):
        upload = self.get_uploads()[0]
        value_key = str(upload.key())
        form_fields = {
            'name': self.request.get("filename"),
            'blob_key': value_key,
            'file_type': self.request.get("file_type")
        }

        values = json.dumps(form_fields)
        post_url = 'http://{0}/_ah/api/metaapi/v1/file'.format(
                    modules.get_hostname(module='default'))
        headers = {'Content-Type': 'application/json'}
        result = urlfetch.fetch(
            url=post_url,
            payload=values,
            method=urlfetch.POST,
            headers = headers
        )
        if result.status_code == 200:
            self.redirect('/upload')
        else:
            self.error(400)

class DownloadHandler(blobstore_handlers.BlobstoreDownloadHandler):
    def get(self, file_key):
        if not blobstore.get(file_key):
            self.error(404)
        else:
            self.send_blob(file_key)

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/download/([^/]+)?', DownloadHandler),
                            ('/files', FilePage)], debug=True)
