import webapp2

from secrets import SESSION_KEY
import basehandlers
from handlers import pages, datahandlers, edit_filehandlers

# Build a config for the sessions to ensure security
app_config = {
  'webapp2_extras.sessions': {
    'cookie_name': '_simpleauth_sess',
    'secret_key': SESSION_KEY
  },
  'webapp2_extras.auth': {
    'user_attributes': []
  }
}
app = webapp2.WSGIApplication([('/', pages.MainPage),
                            ('/viewfiles', pages.FilePage),
                            ('/editpage/([^/]+)?', pages.EditPage),
                            ('/upload', datahandlers.UploadHandler),
                            ('/download/([^/]+)?', datahandlers.DownloadHandler),
                            ('/files', datahandlers.FileHandler),
                            ('/files/([^/]+)?', datahandlers.FileHandler),
                            ('/share/([^/]+)?', datahandlers.ShareHandler),
                            ('/watermark/([^/]+)?', edit_filehandlers.WaterMarkHandler),
                            ('/greyscale/([^/]+)?', edit_filehandlers.GreyscaleHandler),
                            webapp2.Route('/auth/<provider>', handler='basehandlers.AuthHandler:_simple_auth'),
                            webapp2.Route('/auth/<provider>/callback',
                             handler='basehandlers.AuthHandler:_auth_callback',
                             name='auth_callback'),
                            webapp2.Route('/logout',
                             handler='basehandlers.AuthHandler:logout',
                              name='logout')],
                               config=app_config, debug=True)
