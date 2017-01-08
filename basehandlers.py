import webapp2
import webob.multidict
import secrets

from webapp2_extras import auth, sessions
from google.appengine.ext import ndb
from simpleauth import SimpleAuthHandler
from simpleauth import Error as AuthError

FACEBOOK_AVATAR_URL = 'https://graph.facebook.com/{0}/picture?type=large'

class BaseHandler(webapp2.RequestHandler):
    """Base handler for the basic functionality of webapp2 such as Authentication"""
    USER_ATTRS = {
        'googleplus': {
            'provider': 'google',
            'friendly_name': 'Google',
            'image': lambda img: ('avatar_url', img.get('url', "value")),
            'displayName': 'name',
            'url': 'link'
        },
        'linkedin2': {
            'provider': 'linkedin',
            'friendly_name': 'LinkedIn',
            'picture-url': 'avatar_url',
            'first-name': 'name',
            'public-profile-url': 'link'
        },
        'facebook': {
            'provider': 'facebook',
            'friendly_name': 'Facebook',
            'id': lambda id: ('avatar_url', FACEBOOK_AVATAR_URL.format(id)),
            'name': 'name',
            'link': None
        }
    }

    def dispatch(self):
        """Overrides the basic functionality of a webapp2 request to offer added functionality"""
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Allow other domains to access the API's
            self.response.headers.add('Access-Control-Allow-Origin', '*')
            webapp2.RequestHandler.dispatch(self)
        except AuthError:
            # Error with login providers, therefore return to home page
            self.redirect('/')
        finally:
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        """Returns a session using the default cookie key"""
        return self.session_store.get_session()
    
    @webapp2.cached_property
    def auth(self):
        """Returns an authorisation object"""
        return auth.get_auth()

    @webapp2.cached_property
    def current_user(self):
        """Returns currently logged in user"""
        user_dict = self.auth.get_user_by_session()
        return self.auth.store.user_model.get_by_id(user_dict['user_id'])
    
    @webapp2.cached_property
    def logged_in(self):
        """Returns true if a user is currently logged in, false otherwise"""
        return self.auth.get_user_by_session() is not None
    
    @webapp2.cached_property
    def get_logins(self):
        """Returns all logins we can use"""
        logins = []
        for key, value in self.USER_ATTRS.iteritems():
            logins.append({
                'name': key,
                'provider': value['provider'],
                'friendly_name': value['friendly_name']
            })
        
        # Sort by provider name
        logins = sorted(logins, key=lambda login: login['friendly_name'])
        return logins

class AuthHandler(BaseHandler, SimpleAuthHandler):
    """Handles the Authentication requests with external providers"""
    def _on_signin(self, data, auth_info, provider, extra=None):
        """Functionality to occur when a User signs in

            Args:
                data: The data returned from the provider
                auth_info: Information about the authentication
                provider: The provider being used to sign in
                extra: Any extra data from the provider
        """

        auth_id = '%s:%s' % (provider, data['id'])

        user = self.auth.store.user_model.get_by_auth_id(auth_id)
        _attrs = self._to_user_model_attrs(data, self.USER_ATTRS[provider])

        if user:
            user.populate(**_attrs)
            user.put()
            self.auth.set_session(self.auth.store.user_to_dict(user))

        else:
            # check whether there's a user currently logged in
            # then, create a new user if nobody's signed in,
            # otherwise add this auth_id to currently logged in user.

            if self.logged_in:
                updating_user = self.current_user
                updating_user.populate(**_attrs)
                updating_user.add_auth_id(auth_id)

            else:
                success, user = self.auth.store.user_model.create_user(auth_id, **_attrs)
                if success:
                    self.auth.set_session(self.auth.store.user_to_dict(user))
      
        destination_url = '/'

        # Check if a destination was specified in the request
        if extra is not None:
            params = webob.multidict.MultiDict(extra)
            destination_url = str(params.get('destination_url', '/'))
        return self.redirect(destination_url)

    def logout(self):
        """Functionality to occur on the User logging out"""
        self.auth.unset_session()
        self.redirect("/")

    def _callback_uri_for(self, provider):
        """Retrieve the callback url for a given provider
        
            Args:
                provider: The provider to get the url for
        """
        return self.uri_for('auth_callback', provider=provider, _full=True)

    def _get_consumer_info_for(self, provider):
        """Returns the secrets of a given provider

            Args:
                provider: The Provider to get the secrets for
        """
        return secrets.AUTH_CONFIG[provider]

    def _get_optional_params_for(self, provider):
        """Returns optional parameters for auth init requests."""
        return secrets.AUTH_OPTIONAL_PARAMS.get(provider)

    def _to_user_model_attrs(self, data, attrs_map):
        """Get the needed information from the provider dataset."""
        user_attrs = {}
        for k, v in attrs_map.iteritems():
            attr = (v, data.get(k)) if isinstance(v, str) else v(data.get(k))
            user_attrs.setdefault(*attr)

        return user_attrs
