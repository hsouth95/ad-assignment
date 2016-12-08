import datetime, time

from google.appengine.ext import ndb

class Tag(ndb.Model):
    name = ndb.StringProperty

class FileModel(ndb.Model):
    name = ndb.StringProperty()
    file_type = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()
    metadata = ndb.JsonProperty()
    tags = ndb.StructuredProperty(Tag, repeated=True)

    def get_json(self):
        properties = self.to_dict()

        # Stringifying the blob key returns the key itself
        properties['blob_key'] = str(properties['blob_key'])

        # The ID is not included in the to_dict function
        properties['key'] = self.key.id()

        # Retrieve the seconds, and convert to miliseconds
        properties['created'] = int(time.mktime(properties['created'].timetuple())) * 1000

        return properties