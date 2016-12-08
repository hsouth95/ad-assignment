import datetime, time

from google.appengine.ext import ndb

class Tag(ndb.Model):
    name = ndb.StringProperty()


class Metadata(ndb.Model):


class ImageMetadata(Metadata):
    height = ndb.IntegerProperty()
    width = ndb.IntegerProperty()

class FileModel(ndb.Model):
    name = ndb.StringProperty()
    file_type = ndb.StringProperty()
    blob_key = ndb.BlobKeyProperty()
    metadata = ndb.StructuredProperty(Metadata, repeated=False)
    tags = ndb.StructuredProperty(Tag, repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)

    def get_json(self):
        properties = self.to_dict()

        if properties.has_key('blob_key'):
            # Stringifying the blob key returns the key itself
            properties['blob_key'] = str(properties['blob_key'])

        # The ID is not included in the to_dict function
        properties['key'] = self.key.id()

        if properties.has_key('created') and \
           isinstance(properties['created'], datetime.datetime):
            # Retrieve the seconds, and convert to miliseconds
            properties['created'] = int(time.mktime(properties['created'].timetuple())) * 1000

        return properties