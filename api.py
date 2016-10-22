import webapp2

from google.appengine.ext import ndb
from google.appengine.api import modules

class Api(webapp2.RequestHandler):
    def get(self):
        self.response.out.write("Here!")

app = webapp2.WSGIApplication([('/', Api)], debug=True)
