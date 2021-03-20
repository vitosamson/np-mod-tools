const tokenUrl = 'https://www.reddit.com/api/v1/access_token';
const clientId = '__CLIENT_ID__'; // this is replaced during the build process. each browser gets a unique client ID
const basicAuth = `Basic ${btoa(`${clientId}:`)}`;
const redirectUri = chrome.identity.getRedirectURL();
const scopes = ['modflair', 'modmail', 'modposts', 'submit', 'privatemessages', 'wikiread'].join('%20');

// bad token values sometimes get stored to localStorage
const checkValidToken = token => token && token !== 'undefined' && token !== 'null';

/**
 * Note: this listener can't be an async function since it must return a boolean, not a Promise<boolean>.
 */
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === 'oauth') {
    const token = localStorage.getItem('np-mod-token');
    const refreshToken = localStorage.getItem('np-mod-refresh-token');

    if (checkValidToken(token) && checkValidToken(refreshToken)) {
      const form = new URLSearchParams();
      form.set('grant_type', 'refresh_token');
      form.set('refresh_token', refreshToken);

      fetch(tokenUrl, {
        method: 'POST',
        headers: {
          Authorization: basicAuth,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body: form,
      })
        .then(res => res.json())
        .then(json => {
          localStorage.setItem('np-mod-token', json.access_token);
          sendResponse(json.access_token);
        });

      return true;
    }

    const authPageUrl = `
      https://www.reddit.com/api/v1/authorize?
      client_id=${clientId}&
      response_type=code&
      redirect_uri=${redirectUri}&
      scope=${scopes}&
      state=whatever&
      duration=permanent
    `.replace(/\s/g, '');

    chrome.identity.launchWebAuthFlow(
      {
        url: authPageUrl,
        interactive: true,
      },
      async url => {
        let code = new URLSearchParams(url).get('code');

        // The reddit /authorize endpoint has started tacking on some weird characters at the end of the url returned
        // in the auth flow, leading to an invalid token. Strip those characters out.
        if (code.endsWith('#_')) {
          code = code.slice(0, -2);
        }

        const authForm = new URLSearchParams();
        authForm.set('code', code);
        authForm.set('redirect_uri', redirectUri);
        authForm.set('grant_type', 'authorization_code');

        const res = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            Authorization: basicAuth,
            'content-type': 'application/x-www-form-urlencoded',
          },
          body: authForm,
        });
        const json = await res.json();

        localStorage.setItem('np-mod-token', json.access_token);
        localStorage.setItem('np-mod-refresh-token', json.refresh_token);
        sendResponse(json.access_token);
      }
    );

    return true;
  }
});
