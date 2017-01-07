import webapp2
import StringIO
import base64

from google.appengine.api import urlfetch
from PIL import Image, ImageFilter, ImageDraw, ImageFont
import basehandlers

class WaterMarkHandler(basehandlers.BaseHandler):
    """Handles the watermarking of an image

        Attributes:
            FONT_TYPE (str): Font file to use for the watermark
    """
    FONT_TYPE = "Promocyja096.ttf"


    def post(self, response_type):
        """Updates a given image with a watermark of a given value

            Args:
                response_type: The type of response it expects e.g. Base64
        """
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

        font = WaterMarkHandler.__get_font(value, im)
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

    @staticmethod
    def __get_font(value, im):
        """Retrieves the font for the Watermark with a flexible size

            Args:
                value: The text value being watermarked
                im: The image being watermarked

            Returns:
                A font to be used in drawing on a File
        """
        # Starting font size
        fontsize = 1  

        # Portion of image width text width will be
        img_fraction = 0.40

        # Increment image size until it fills required width of picture
        font = ImageFont.truetype(WaterMarkHandler.FONT_TYPE, fontsize)
        while font.getsize(value)[0] < img_fraction * im.size[0]:
            # iterate until the text size is just larger than the criteria
            fontsize += 1
            font = ImageFont.truetype(WaterMarkHandler.FONT_TYPE, fontsize)

        return ImageFont.truetype(WaterMarkHandler.FONT_TYPE, fontsize)

class ResizeHandler(basehandlers.BaseHandler):
    """Handles the resizing of an Image"""
    @classmethod
    def post(self, response_type):
        """Updates a given image to be of a given dimensions

            Args:
                response_type: The type of response it expects e.g. Base64
        """
        file_value = None
        
        if self.request.get("file"):
            file_value = self.request.POST.get("file").file.read()
        else:
            self.error(400)
            self.response.write("No image given")
            return

        temp_buff = StringIO.StringIO(file_value)

        im = Image.open(temp_buff)

        width, height = im.size

        requested_height = self.request.get("height")
        requested_width = self.request.get("width")

        if requested_height and requested_height.isdigit() and requested_height >= 0:
            height = requested_height

        if requested_width and requested_width.isdigit() and requested_width >= 0:
            width = requested_width

        updatedImage = im.resize((int(width), int(height)), Image.ANTIALIAS) 

        output = StringIO.StringIO()
        updatedImage.save(output, im.format)
        finished_image = output.getvalue()
        
        # Check to see if image response should be in a particular format
        if response_type:
            if response_type == "base64":
                self.response.write(base64.b64encode(finished_image))
                return
            
        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(finished_image)

class GreyscaleHandler(basehandlers.BaseHandler):
    """Handles the greyscaling of an image"""
    @classmethod
    def post(self, response_type):
        """Updates a given image to be greyscaled

            Args:
                response_type: The type of response it expects e.g. Base64
        """
        file_value = None
        
        if self.request.get("file"):
            file_value = self.request.POST.get("file").file.read()
        else:
            self.error(400)
            self.response.write("No image given")
            return
        
        temp_buff = StringIO.StringIO(file_value)

        im = Image.open(temp_buff)
        updated_image = im.convert("L")

        output = StringIO.StringIO()
        updated_image.save(output, im.format)
        finished_image = output.getvalue()
        
        # Check to see if image response should be in a particular format
        if response_type:
            if response_type == "base64":
                self.response.write(base64.b64encode(finished_image))
                return
            
        self.response.headers["Content-Type"] = "image/" + im.format.lower()
        self.response.write(finished_image)