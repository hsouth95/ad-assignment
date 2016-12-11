import webapp2

from views import *

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/download/([^/]+)?', DownloadHandler),
                            ('/viewfiles', FilePage),
                            ('/files', FileHandler),
                            ('/edit/image', EditImageHandler),
                            ('/watermark', WaterMarkHandler)], debug=True)