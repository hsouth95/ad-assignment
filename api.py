import endpoints
from protorpc import remote
from protorpc import messages
from protorpc import message_types

from google.appengine.ext import ndb
from google.appengine.ext.blobstore import BlobKey

class FileModel(ndb.Model):
    name = ndb.StringProperty(required=True)
    blob_key = ndb.BlobKeyProperty()

class File(messages.Message):
    key = messages.IntegerField(1, required=True)
    name = messages.StringField(2)
    blob_key = messages.StringField(3)

class FileList(messages.Message):
    items = messages.MessageField(File, 1, repeated = True)

@endpoints.api(name='fileapi', version='v1', description='API for files')
class FileService(remote.Service):
    @endpoints.method(File, File,
                      name='file.insert',
                      path='file',
                      http_method='POST')
    def insert_file(self, request):
        file = FileModel(name = request.name, blob_key = BlobKey(request.blob_key))

        file.put()

        return request

    @endpoints.method(message_types.VoidMessage, FileList,
                      name='file.list',
                     path='files',
                      http_method='GET')
    def list_files(self, request):
        results = FileModel.query().fetch(10, keys_only=True)
        if results is None:
            raise endpoints.NotFoundException('No files found.')

        files = []
        for item in results:
            files.append(File(key=item.id()))
        return FileList(items=files)

    @endpoints.method

#    @endpoints.method(GET_RESOURCE, FILE,
#                      path='files/{id}',
#                      http_method='GET',
#                      name='files.get')
#    def get_file(self, request):
#        return File(name="yolo", blob_key="ajghag")

app = endpoints.api_server([FileService], restricted=False)
