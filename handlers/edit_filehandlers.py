import webapp2
import StringIO
import base64

from google.appengine.api import urlfetch
from PIL import Image, ImageFilter, ImageDraw, ImageFont
from PIL.ExifTags import TAGS
import basehandlers

class WaterMarkHandler(basehandlers.BaseHandler):
    def post(self, response_type):
        file_value = None
        file_url = None
        
        if self.request.get("file"):
            file_value = self.request.POST.get("file").file.read()
        elif self.request.get("url"):
            file_url = self.request.get("url")
            file_value = urlfetch.fetch(file_url).content
        else:
            self.response.write("No image given")
            self.error(400)
            return
        
        value = self.request.get("value")

        if not value:
            self.response.write("No value given")
            self.error(400)
            return

        temp_buff = StringIO.StringIO(file_value)

        im = Image.open(temp_buff)

        if im.format is not "JPEG":
            self.error(400)
            self.response.write("Only JPEG formats are currently supported")
            return

        # Starting font size
        fontsize = 1  

        # Portion of image width text width will be
        img_fraction = 0.40

        # Increment image size until it fills required width of picture
        font = ImageFont.truetype("Promocyja096.ttf", fontsize)
        while font.getsize(value)[0] < img_fraction * im.size[0]:
            # iterate until the text size is just larger than the criteria
            fontsize += 1
            font = ImageFont.truetype("Promocyja096.ttf", fontsize)


        font = ImageFont.truetype("Promocyja096.ttf", fontsize)
        d = ImageDraw.Draw(im)

        d.text((10, 10), value, fill=(255, 255, 255, 128), font=font)

        output = StringIO.StringIO()
        im.save(output, im.format)
        finished_image = output.getvalue()

        # Check to see if image response should be in a particular format
        if response_type:
            if response_type == "base64":
                self.response.write(base64.b64encode(finished_image))
                return
        
        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(finished_image)

class GreyscaleHandler(basehandlers.BaseHandler):
    def post(self, response_type):
        file_value = None
        
        if self.request.get("file"):
            file_value = self.request.POST.get("file").file.read()
        else:
            self.error(400)
            self.response.write("No image given")
            return
        
        temp_buff = StringIO.StringIO(file_value)

        im = Image.open(temp_buff)
        im = im.convert("L")

        output = StringIO.StringIO()
        im.save(output, "PNG")
        finished_image = output.getvalue()
        
        # Check to see if image response should be in a particular format
        if response_type:
            if response_type == "base64":
                self.response.write(base64.b64encode(finished_image))
                return
            
        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(finished_image)