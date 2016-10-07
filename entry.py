from google.appengine.ext import ndb

class Entry(ndb.Model):
    content = ndb.StringProperty(indexed=False)
