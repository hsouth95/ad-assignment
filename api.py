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
    owner = ndb.UserProperty()
    created = ndb.DateTimeProperty(auto_now_add=True)

@endpoints.api(name='metaapi', version='v1', description='API for File meta data',
               audiences=[endpoints.API_EXPLORER_CLIENT_ID])
class MetaApi(remote.Service):
    @FileModel.method(user_required=True,
                      path='file', http_method='POST', name='file.insert')
    def FileInsert(self, file):
        file.owner = endpoints.get_current_user()
        file.put()
        return file

    @FileModel.query_method(query_fields=('limit', 'order', 'pageToken'),
                            path='files', name='file.list', user_required=True)
    def FileList(self, query):
        return query.filter(FileModel.owner == endpoints.get_current_user())

app = endpoints.api_server([MetaApi], restricted=False)
