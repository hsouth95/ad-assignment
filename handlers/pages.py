import jinja2
import webapp2

from google.appengine.ext import ndb
from google.appengine.ext import blobstore
from handlers import basehandlers
from models import Collaboration, FileModel

LOGOUT_URL = "/logout"
template_env = jinja2.Environment(loader=jinja2.FileSystemLoader("views"))

class MainPage(basehandlers.BaseHandler):
    def get(self):
        upload_url = blobstore.create_upload_url('/upload')
        template = template_env.get_template('home.html')

        user = None
        logins = self.get_logins

        if self.logged_in:
            user = self.current_user

        context = {
            'upload_url': upload_url,
            'title': "WS Ltd Prototype",
            'logout_url': LOGOUT_URL,
            'user': user,
            'logins': logins
        }

        self.response.out.write(template.render(context))

class FilePage(basehandlers.BaseHandler):
    def get(self):
        if self.logged_in:
            user = self.current_user

            template = template_env.get_template('files.html')
            context = {
                'title': 'WS Ltd Prototype',
                'logout_url': LOGOUT_URL,
                'user': user
            }
            self.response.out.write(template.render(context))
        else:
            self.redirect("/")

class EditPage(basehandlers.BaseHandler):
    def get(self, collab_id):
        if id:
            collab = Collaboration.get_by_id(long(collab_id))

            if collab:
                file_model_key = collab.file_model
                file_model = file_model_key.get()

                if file_model:
                    user = None
                    # User does not need to be logged in to edit the collaborated file
                    if self.logged_in:
                        user = self.current_user

                    template = template_env.get_template("edit.html")
                    context = {
                        "title": "WS Ltd Prototype",
                        "logout_url": LOGOUT_URL,
                        "user": user,
                        "file_model": file_model 
                    }
                    self.response.write(template.render(context))
                else:
                    self.error(404)
