import datetime, time

from google.appengine.ext import ndb

class Tag(ndb.Model):
    name = ndb.StringProperty()

class AudioMetadata(ndb.Model):
    """The metadata of an audio file"""
    duration = ndb.FloatProperty()

class VideoMetadata(ndb.Model):
    """The metadata of a video file"""
    duration = ndb.FloatProperty()

class ImageMetadata(ndb.Model):
    """The metadata of an Image file"""
    height = ndb.IntegerProperty()
    width = ndb.IntegerProperty()
    camera = ndb.StringProperty()

class FileModel(ndb.Model):
    """The main File Model"""
    name = ndb.StringProperty(required=True)
    user = ndb.StringProperty(required=True)
    file_type = ndb.StringProperty(required=True)
    blob_key = ndb.BlobKeyProperty(required=True)
    extension = ndb.StringProperty()
    size = ndb.IntegerProperty()
    image_metadata = ndb.StructuredProperty(ImageMetadata)
    audio_metadata = ndb.StructuredProperty(AudioMetadata)
    video_metadata = ndb.StructuredProperty(VideoMetadata)
    tags = ndb.StructuredProperty(Tag, repeated=True)
    created = ndb.DateTimeProperty(auto_now_add=True)

    def get_json(self):
        """Builds a json object based on the attributes of the model"""
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
        
class Collaboration(ndb.Model):
    """A model to allow sharing files"""
    file_model = ndb.KeyProperty(kind=FileModel, required=True)