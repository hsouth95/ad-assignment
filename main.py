from webapp2 import WSGIApplication, Route

from secrets import SESSION_KEY
from handlers import *

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

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/download/([^/]+)?', DownloadHandler),
                            ('/viewfiles', FilePage),
                            ('/files', FileHandler),
                            ('/watermark/([^/]+)?', WaterMarkHandler),
                            ('/mock', MockHandler),
                            Route('/auth/<provider>', handler='handlers.AuthHandler:_simple_auth', name='auth_login'),
                            Route('/auth/<provider>/callback', handler='handlers.AuthHandler:_auth_callback', name='auth_callback'),
                            Route('/logout', handler='handlers.AuthHandler:logout', name='logout')], config=app_config, debug=True)