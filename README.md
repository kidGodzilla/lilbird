# LilBird
Tinybird Event API helper library. 

Adds routine Analytics.js style tracking to Tinybird with as little setup as possible.

![Lilbird](bird.png?raw=true "Lilbird, stable diffusion")

## Tinybird Signup & Setup

1. Head to https://www.tinybird.co/
2. Create a new account
3. Put your data into the EU region when prompted
4. Create a new **Auth Token**. This is your `WRITE_KEY`.
   1. You should only select: `DATA SOURCES SCOPES`
      1. Create new Data Sources or append data to existing ones **(ENABLED)**
   2. This will allow your key to be used to send events to Tinybird, create Data Sources (tables) on the fly, and not much else.

You should create a write-only key for your Tinybird instance. They'll give you a key with lots of permissions when you sign up. For security reasons, don't use this one.

![Create a Tinybird Write Key](write-key.png?raw=true "Create a Tinybird Write Key")

## Setup

### Inline (HTML)

```html
<script>window.TINYBIRD_CONFIGURATION = { WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY' }</script>
<script src="https://cdn.jsdelivr.net/npm/lilbird@latest"></script>
```

You should create a write-only key for your Tinybird instance. See instructions above.

### NPM

```shell
npm i -s lilbird
```

Then, in your project:

```js
import * as Lilbird from 'lilbird';

Lilbird.init({ WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY' });
```

## Usage

Like most event analytics platforms, Lilbird exposes a `track()` and an `identify()` method. 

**Identify** is used to set properties on your current user, which describes the user. For example, you could identify whether the user is a paying customer, or on a free trial, with `identify({ trial: false })`

**Track** sends an event to Tinybird, which includes every property identified for this user. For example, you could `track('new_project_created')` to later visualize the number of new projects created over time.

If you wanted to track new projects created by type, you could send that like this; `track('new_project_created', { type: 'IT' '})`. 

It is recommended that you enforce types and set a default value for every column (user or event property) you send to Tinybird. See "Enforce Types" and "Default Values" below.

### Event properties that are added automatically, if not defined

1. A timestamp is appended to each event under the namespace `ts`
   1. This is formatted as an ISOString ([ISO 8601](https://en.wikipedia.org/wiki/ISO_8601))
2. A unique session identifier is stored in sessionStorage and appended to each event under the namespace `session_id`
3. An anonymous device identifier is appended to each event under the namespace `anonymous_device_id`
   1. If your requirements are minimal, you can use this as your unique user identifier. Otherwise, send a `uid` or `uuid` to whatever namespace you like, and use this as your fallback identifier for anonymous users.

### Disabling Automatic Event Properties

Each of these can be disabled by sending the appropriate configuration:

```js
Lilbird.init({ 
   WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY',
   ADD_ANONYMOUS_DEVICE_ID: false,
   ADD_SESSION_ID: false,
   ADD_TS: false,
});
```

### Identifying users (Optional)

You can identify users before sending a `track()` event. This appends data to the user, which will be sent alongside each `track()` event.

Example:

```js
var uid = '123456';

Lilbird.identify(uid, {
   user: true,
   age: 32,
   admin: false,
   beta: false,
   name: 'John Doe',
});
```

UID is optional. You can omit it, or even include it in the body:

```js
Lilbird.identify({
   user: true,
   age: 32,
   admin: false,
   beta: false,
   name: 'John Doe',
});
```

## Tracking Events

Events are tracked using the `track()` method. This tracks an event by adding a row to a Data Source in Tinybird.

Event names can be letters, numbers, dashes, underscores, but no spaces or special characters.

Example:

```js
var event_name = 'signed_up';

Lilbird.track(event_name, {
   username: 'bob'
});
```

The payload is optional, and describes the event you are tracking. Be aware, namespaces conflict with values sent via the Identify method, and should be unique. If you have previously sent a value, it must be of the same type each time it is sent.

You can also track an event without a payload.

```js
Lilbird.track('login');
```

## Default Values

Tinybird enforces strict checks on each ingested row, and quarantines any row with a missing column. Therefore, it's a good idea to provide default values for every column that isn't nullable.

Keep in mind, sometimes rejected data is what you really want. Instead of allowing Tinybird to ingest bad data (like in our example below, login events without a username), you may want to skip defaults, and allow the invalid rows to be rejected. Otherwise, you're going to be writing SQL later to filter out the invalid data.

Here's an example of how you can set defaults with the `DEFAULTS` configuration namespace:

```js
Lilbird.init({
   WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY',
   DEFAULTS: {
      "*": {
         "created_at": 0
      },
      "login": {
         "username": "-"
      }
   }
});
```

In this example, if we sent a `login` event with no body, it would get a default value for both `created_at` and `username`, preventing any related insertion errors.

## Enforce Types

Tinybird enforces strict type checks on each ingested row, and rows with any column that doesn't match your schema will be quarantined and permanently rejected.

So, you can enforce types for your incoming data, via configuration, to prevent this from occurring.

Available types are:
- boolean
- integer
- string
- float

Here's an example:

```js
Lilbird.init({
   WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY',
   ENFORCE_TYPES: {
      "*": {
         "created_at": 'integer'
      },
      "login": {
         "username": "string",
         "company": "string",
         "age": "integer",
         "is_registered": "boolean",
         "pixel_ratio": "float"
      }
   }
});
```

## Custom Body Transformation (Advanced)

Tinybird has strict type checking and enforcement, so you may need to do data transformation on events before they're sent, to prevent validation errors.

You can do that with a `BODY_TRANSFORMATION` function, which modifies the body before Tinybird ingestion.

**Note:** this is a synchronous function, which must return the body once it is modified.

**Example:** 

```js
Lilbird.init({
   WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY',
   BODY_TRANSFORMATION: function(body, event_name) {
       if (event_name === 'pageview') {
           // Do something
           if (typeof body.ts === 'string') body.ts = parseInt(body.ts);
       }
       
       return body;
   }
});
```

## Transform all numbers to strings

The configuration option `TRANSFORM_NUMBERS_TO_STRINGS` transforms all properties which are numbers into strings.

```js
Lilbird.init({
   WRITE_KEY: 'p.YOURTINYBIRDWRITEKEY',
   TRANSFORM_NUMBERS_TO_STRINGS: true
});
```
