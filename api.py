import endpoints
from protorpc import remote
from protorpc import messages

class File(messages.Message):
    name = messages.StringField(1, required=True)
    blob_key = messages.StringField(2, required=True)

@endpoints.api(name='fileapi', version='v1', description='API for files')
class FileService(remote.Service):
    @endpoints.method(File, File,
                      name='file.insert',
                      path='file',
                      http_method='POST')
    def insert_file(self, request):
        return request

    @endpoints.method(File, File,
                      name='file.get',
                      path='file',
                      http_method='GET')
    def get_file(self, request):
        return "hello"

app = endpoints.api_server([FileService], restricted=False)
