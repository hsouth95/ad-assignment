import datetime
import jinja2
import os
import webapp2
import entry

from google.appengine.ext import ndb
from google.appengine.api import users

template_env = jinja2.Environment(loader=jinja2.FileSystemLoader(os.getcwd()))

class MainPage(webapp2.RequestHandler):
    def get(self):

        template = template_env.get_template('home.html')
        self.response.out.write(template.render())

class EntryPage(webapp2.RequestHandler):
    def post(self):
        entry = Entry(content=self.request.get("meta"))
        entry.put()

class Entry(ndb.Model):
    content = ndb.StringProperty(indexed=False)

app = webapp2.WSGIApplication([('/', MainPage), ('/entry', EntryPage)], debug=True)
