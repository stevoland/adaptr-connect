# adaptr-connect

WIP

Client feature detection on your server

## Concept

Sometimes we want to make large changes in server rendered content based on client features but
we have no chance of testing for features before the first request.

adaptr-connect provides connect middleware which allows us to pause a response until a script has
run on the client which runs the feature tests and sends them to the server with a beacon request.
It then stores a cookie to bypass this process for subsequent requests.

## Features (TODO)

* Provides a `Profile` instance on client and server for requesting values
* `Profile` values can be configured to update (eg: on viewport resize)
* `Profile` values can be automatically 'locked' to ensure client and server renders are identical
(useful for [React](http://reactjs.org))
* Timeout so paused responses are resolved in case of no JS / network error
* Ignore User Agent list to bypass pausing response for eg: Google so request time metrics aren't affected

## Prior art

* Based on: [this gist](https://gist.github.com/fdecampredon/86ccbba3863bccaec7dd)
* [Yiibu Profile](https://github.com/yiibu/profile)
* [Yiibu Bento](https://github.com/yiibu/bento)
