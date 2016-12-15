import datetime, time

from google.appengine.ext import ndb

class Tag(ndb.Model):
    name = ndb.StringProperty()

class AudioMetadata(ndb.Model):
    duration = ndb.FloatProperty()

class VideoMetadata(ndb.Model):
    duration = ndb.FloatProperty()

class ImageMetadata(ndb.Model):
    height = ndb.IntegerProperty()
    width = ndb.IntegerProperty()

class FileModel(ndb.Model):
    name = ndb.StringProperty(required=True)
    user = ndb.StringProperty(required=True)
    file_type = ndb.StringProperty(required=True)
    blob_key = ndb.BlobKeyProperty(required=True)
    extension = ndb.StringProperty()
    image_metadata = ndb.StructuredProperty(ImageMetadata)
    audio_metadata = ndb.StructuredProperty(AudioMetadata)
    video_metadata = ndb.StructuredProperty(VideoMetadata)
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