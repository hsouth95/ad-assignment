import endpoints
from protorpc import remote
from protorpc import messages
from protorpc import message_types

from google.appengine.ext import ndb
from google.appengine.ext.blobstore import BlobKey

from endpoints_proto_datastore.ndb import EndpointsModel

class FileModel(EndpointsModel):
    _message_fields_schema = ('id', 'name', 'file_type', 'blob_key')

    name = ndb.StringProperty()
    file_type = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()

@endpoints.api(name='metaapi', version='v1', description='API for File meta data')
class MetaApi(remote.Service):

    @FileModel.method(path='file', http_method='POST', name='file.insert')
    def FileInsert(self, file):
        file.put()
        return file

    @FileModel.query_method(path='files', name='file.list')
    def FileList(self, query):
        return query

app = endpoints.api_server([MetaApi], restricted=False)
