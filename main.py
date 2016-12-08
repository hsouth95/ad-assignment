import webapp2

from views import *

app = webapp2.WSGIApplication([('/', MainPage),
                            ('/upload', UploadHandler),
                            ('/download/([^/]+)?', DownloadHandler),
                            ('/edit', FileSend),
                            ('/files', FilePage),
                            ('/getfiles', FileHandler)], debug=True)
