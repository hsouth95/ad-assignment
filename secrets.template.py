# This is a session secret key used by webapp2 framework.
SESSION_KEY = "sesh"

# Google APIs
GOOGLE_APP_ID = 'client id'
GOOGLE_APP_SECRET = 'secret'

# Facebook auth apis
FACEBOOK_APP_ID = 'app id'
FACEBOOK_APP_SECRET = 'app secret'

AUTH_CONFIG = {
  # OAuth 2.0 providers,
  'googleplus': (GOOGLE_APP_ID, GOOGLE_APP_SECRET, 'profile'),
  'facebook': (FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, 'user_about_me')
}

AUTH_OPTIONAL_PARAMS = {
}