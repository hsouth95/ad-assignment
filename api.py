import cgi
from google.appengine.ext import ndb
from google.appengine.ext.blobstore import BlobKey

class FileModel(ndb.Model):
    name = ndb.StringProperty()
    file_type = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()
    date = ndb.DateTimeProperty(auto_now_add=True)

class FileHandler(webbapp2.RequestHandler):
    def get(self):
        files = FileModel.fetch(10)

        self.response.out.write(cgi.escape(files))

app = endpoints.api_server([MetaApi], restricted=False)
