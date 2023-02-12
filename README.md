# LilBird
TinyBird Event API helper library. 

Adds routine Analytics.js style tracking to TinyBird with as little setup as possible.

![Lilbird](bird.png?raw=true "Lilbird, stable diffusion")

## TinyBird Signup & Setup

1. Head to https://www.tinybird.co/
2. Create a new account
3. Put your data into the EU region when prompted
4. Create a new **Auth Token**. This is your `WRITE_KEY`.
   1. You should only select: `DATA SOURCES SCOPES`
      1. Create new Data Sources or append data to existing ones **(ENABLED)**
   2. This will allow your key to be used to send events to TinyBird, create Data Sources (tables) on the fly, and not much else.

You should create a write-only key for your TinyBird instance. They'll give you a key with lots of permissions when you sign up. For security reasons, don't use this one.

![Create a TinyBird Write Key](write-key.png?raw=true "Create a TinyBird Write Key")

## Setup

### Inline (HTML)

```html
<script>window.TINYBIRD_CONFIGURATION = { WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY' }</script>
<script src="https://cdn.jsdelivr.net/npm/lilbird@latest"></script>
```

You should create a write-only key for your TinyBird instance. See instructions above.

### NPM

```shell
npm i -s lilbird
```

Then, in your project:

```js
import * as LILBIRD from 'lilbird';

LILBIRD.init({ WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY' });
```

## Usage

### Things that happen automatically

1. A timestamp is appended to each event under the namespace `ts`
   1. This is formatted as an ISOString ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601))
2. A unique session identifier is stored in sessionStorage and appended to each event under the namespace `session_id`
3. An anonymous device identifier is appended to each event under the namespace `anonymous_device_id`
   1. If your requirements are minimal, you can use this as your unique user identifier. Otherwise, send a `uid` or `uuid` to whatever namespace you like, and use this as your fallback identifier for anonymous users.



### Identifying users (Optional)

You can identify users before sending a `track()` event. This appends data to the user, which will be sent alongside each `track()` event.

Example:

```js
var uid = '123456';

LILBIRD.identify(uid, {
   user: true,
   age: 32,
   admin: false,
   beta: false,
   name: 'John Doe',
});
```

UID is optional. You can omit it, or even include it in the body:

```js
LILBIRD.identify({
   user: true,
   age: 32,
   admin: false,
   beta: false,
   name: 'John Doe',
});
```

## Tracking Events

Events are tracked using the `track()` method. This tracks an event by adding a row to a Data Source in TinyBird.

Event names can be letters, numbers, dashes, underscores, but no spaces or special characters.

Example:

```js
var event_name = 'signed_up';

LILBIRD.track(event_name, {
   username: 'bob'
});
```

The payload is optional, and describes the event you are tracking. Be aware, namespaces conflict with values sent via the Identify method, and should be unique. If you have previously sent a value, it must be of the same type each time it is sent.

You can also track an event without a payload.

```js
LILBIRD.track('login');
```

