/***
 * A Tinybird Helper Library to send analytics events
 */

if (typeof Object.assign !== 'function') {
  Object.assign = function (target, ...sources) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object (Object.assign polyfill)');
    }

    const to = Object(target);

    sources.forEach((source) => {
      if (source != null) {
        for (const key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            to[key] = source[key];
          }
        }
      }
    });

    return to;
  };
}

function __legacy_generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[x]/g, function (c) {
        var r = Math.floor(Math.random() * 16);
        return r.toString(16);
    });
}

function ___uuidv4() {
    if (!window.crypto || !window.crypto.getRandomValues) {
        return __legacy_generateUUID();
    }

    try {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function (c) {
            return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16);
        });
    } catch(e) {
        return __legacy_generateUUID();
    }
}

// Anonymously tracks a device across sessions
function ___getUID() {
    if (window && typeof window === 'object' && window.document) {
        if (window.__lilbird_uuid) {
            return window.__lilbird_uuid;
        } else {
            try {
                window.__lilbird_uuid = localStorage.getItem('__lilbird_uuid');
                if (!window.__lilbird_uuid) {
                    window.__lilbird_uuid = ___uuidv4();
                    localStorage.setItem('__lilbird_uuid', window.__lilbird_uuid);
                }
                if (window.__lilbird_uuid) return window.__lilbird_uuid;
            } catch(e) { console.warn('Error accessing local storage. (Lilbird.js)') }
        }
    }

    return null;
}

// Anonymously tracks a session
function ___getSessionID() {
    if (window && typeof window === 'object' && window.document) {
        if (window.__lilbird_session_id) {
            return window.__lilbird_session_id;
        } else {
            try {
                window.__lilbird_session_id = sessionStorage.getItem('__lilbird_session_id');
                if (!window.__lilbird_session_id) {
                    window.__lilbird_session_id = ___uuidv4();
                    sessionStorage.setItem('__lilbird_session_id', window.__lilbird_session_id);
                }
                if (window.__lilbird_session_id) return window.__lilbird_session_id;
            } catch(e) { console.warn('Error accessing session storage. (Lilbird.js)') }
        }
    }

    return null;
}

var ___lilbird = {
    user: {},
    configuration: {
        ADD_TS: true,
        ADD_SESSION_ID: true,
        ADD_ANONYMOUS_DEVICE_ID: true,
        RESPECT_DO_NOT_TRACK: true,
        DO_NOT_TRACK: !!navigator.doNotTrack
    },
    config: function (conf) {
        this.configuration = Object.assign(this.configuration, conf);
        if (this.configuration.DEBUG) console.log('Tinybird Configuration (Lilbird.js):', this.configuration);
    },
    init: function (conf) {
        this.configuration = Object.assign(this.configuration, conf);
        if (this.configuration.DEBUG) console.log('Tinybird Configuration (Lilbird.js):', this.configuration);
    },
    track: function (event_name, body) {
        var _debug = this.configuration.DEBUG;

        // Checks
        if (typeof event_name !== 'string') return console.warn('event_name must be of type: string');

        try { event_name = event_name.trim(); } catch(e){}

        if (!event_name) return console.warn('event_name is required by track function (Lilbird.js)');

        if (!/^[A-Za-z0-9_-]*$/gi.test(event_name)) console.warn('event_name can only contain letters, numbers, -, and _ (Lilbird.js)');

        // Configuration attached to window globals
        if (window && typeof window === 'object' && window.document && window.TINYBIRD_CONFIGURATION) {
            this.configuration = Object.assign(this.configuration, window.TINYBIRD_CONFIGURATION);
        }

        if (!this.configuration.WRITE_KEY) console.warn('WRITE_KEY must be set via window.TINYBIRD_CONFIGURATION or init({ WRITE_KEY }) (Lilbird.js)');

        // Overwrite chain for properties to be sent to ClickHouse
        var base_object = {};
        if (this.configuration.ADD_TS) base_object.ts = new Date().toISOString();
        if (this.configuration.ADD_SESSION_ID) base_object.session_id = ___getSessionID();
        if (this.configuration.ADD_ANONYMOUS_DEVICE_ID) base_object.anonymous_device_id = ___getUID();
        body = Object.assign(base_object, this.user, body);

        // Normalize all types in body for Tinybird type safety
        // All numbers should become strings
        if (this.configuration.TRANSFORM_NUMBERS_TO_STRINGS) {
            for (var k in body) {
                if (typeof body[k] === 'number') body[k] = (body[k]).toString();
            }
        }

        // Use DEFAULTS to perform a transformation on the body of the event
        // Enforces default values to avoid Tinybird errors
        if (this.configuration.DEFAULTS && typeof this.configuration.DEFAULTS === 'object') {
            var DEFAULTS = this.configuration.DEFAULTS;
            var global_defaults = DEFAULTS['*'] || {};
            var event_defaults = DEFAULTS[event_name] || {};
            var defaults_for_this_event = Object.assign(global_defaults, event_defaults);

            for (var key in defaults_for_this_event) {
                if (key && defaults_for_this_event.hasOwnProperty(key) && body[key] === undefined) {
                    body[key] = defaults_for_this_event[key];
                }
            }
        }

        // User-defined body transformation
        if (this.configuration.BODY_TRANSFORMATION && typeof this.configuration.BODY_TRANSFORMATION === 'function') {
            var body_transformed = this.configuration.BODY_TRANSFORMATION(body, event_name);
            if (body_transformed && typeof body_transformed === 'object') body = body_transformed;
            else console.warn('No event object returned from BODY_TRANSFORMATION');
        }

        // Enforce Types - string, integer, float, boolean
        if (this.configuration.ENFORCE_TYPES && typeof this.configuration.ENFORCE_TYPES === 'object') {
            var TYPES = this.configuration.ENFORCE_TYPES;
            var global_types = TYPES['*'] || {};
            var event_types = TYPES[event_name] || {};
            var types_for_this_event = Object.assign(global_types, event_types);

            for (var key in types_for_this_event) {
                if (key && types_for_this_event.hasOwnProperty(key) && body[key]) {
                    var type = types_for_this_event[key];

                    if (type === 'float') body[key] = parseFloat(body[key]);
                    if (type === 'integer') body[key] = parseInt(body[key]);
                    if (type === 'boolean') body[key] = !!body[key];
                    if (type === 'string') body[key] = ''+body[key];
                }
            }
        }

        if (this.configuration.RESPECT_DO_NOT_TRACK && this.configuration.DO_NOT_TRACK) return;

        if (_debug) console.log('Tinybird Event (Lilbird.js):', event_name, body);

        try {
            fetch((this.configuration.BASE_URL || 'https://api.tinybird.co/v0/events') + '?name=' + event_name, {
                method: 'POST',
                body: JSON.stringify(body),
                headers: { Authorization: 'Bearer ' + this.configuration.WRITE_KEY }
            })
                .then(function (res) { return res.json() }).then(function (data) { if (_debug) console.log('Tinybird Event response (Lilbird.js)', data) })
                .catch(function (e) { if (_debug) console.log(e) });

        } catch(e) {
            if (_debug) console.log('Failed to fetch (Lilbird.js)');
        }
    },
    identify: function (uid, data) {
        if (typeof data === 'object') {
            try {
                this.user = Object.assign(data, this.user);
                this.user.uid = uid;
            } catch(e) {
                console.warn('Error calling identify function. Possible type mismatch. (Lilbird.js)');
            }
        } else if (typeof uid === 'object' && !data) {
            // identify({}) convenience method
            try {
                this.user = Object.assign(uid, this.user);
            } catch(e) {
                console.warn('Error calling identify function. Possible type mismatch. (Lilbird.js)');
            }
        }

        if (this.configuration.DEBUG) console.log('Tinybird Identify (Lilbird.js):', data || uid, this.user);
    },
};

try {
    if (window && typeof window === 'object' && window.document) {
        window.Lilbird = window.LILBIRD = ___lilbird;

        if (window.Analytics && typeof Analytics === 'function' && Analytics.track && Analytics.identify) {
            Analytics.addAdapter('lilbird', {
                enabled: true,
                test: function () { return !!window.Lilbird },
                track: function (eventName, eventProperties) {
                    // if (window.__debug) console.log('tracking', eventName, eventProperties);
                    Lilbird.track(eventName, eventProperties);
                },
                identify: function (userId, userProperties) {
                    // if (window.__debug) console.log('identifying', userId, userProperties);
                    Lilbird.identify(userId, userProperties);
                },
            });
        }
    }
} catch(e){}

if (typeof module !== 'undefined') {
    module.exports = ___lilbird;
}
