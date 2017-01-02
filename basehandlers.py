import webapp2
import webob.multidict
import secrets

from webapp2_extras import auth, sessions
from google.appengine.ext import ndb
from simpleauth import SimpleAuthHandler

FACEBOOK_AVATAR_URL = 'https://graph.facebook.com/{0}/picture?type=large'

class BaseHandler(webapp2.RequestHandler):
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
            'link': 'link'
        }
    }

    def dispatch(self):
        # Get a session store for this request.
        self.session_store = sessions.get_store(request=self.request)

        try:
            # Dispatch the request.
            webapp2.RequestHandler.dispatch(self)
        finally:
            # Save all sessions.
            self.session_store.save_sessions(self.response)

    @webapp2.cached_property
    def session(self):
        """Returns a session using the default cookie key"""
        return self.session_store.get_session()

    @webapp2.cached_property
    def auth(self):
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
        # Get all logins we can use
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
    def _on_signin(self, data, auth_info, provider, extra=None):
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
                u = self.current_user
                u.populate(**_attrs)
                u.add_auth_id(auth_id)

            else:
                ok, user = self.auth.store.user_model.create_user(auth_id, **_attrs)
                if ok:
                    self.auth.set_session(self.auth.store.user_to_dict(user))
      
        destination_url = '/'

        # Check if a destination was specified in the request
        if extra is not None:
            params = webob.multidict.MultiDict(extra)
            destination_url = str(params.get('destination_url', '/'))
        return self.redirect(destination_url)

    def logout(self):
        self.auth.unset_session()
        self.redirect("/")

    def _callback_uri_for(self, provider):
        return self.uri_for('auth_callback', provider=provider, _full=True)

    def _get_consumer_info_for(self, provider):
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
