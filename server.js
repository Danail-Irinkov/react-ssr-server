import http from 'http'
import browserify from 'browserify'
import literalify from 'literalify'
import React from 'react'
import fs from 'fs'
import ReactDOMServer from 'react-dom/server.cjs'
import DOM from 'react-dom-factories'
let body = DOM.body, div = DOM.div, script = DOM.script
// This is our React component, shared by server and browser thanks to browserify
// let App = React.createFactory(import('./App.js'))
let app_raw = fs.readFileSync('./src/App.js').toString()
let App = React.createFactory(app_raw)

// A variable to store our JS, which we create when /bundle.js is first requested
let BUNDLE = null

// Just create a plain old HTTP server that responds to two endpoints ('/' and
// '/bundle.js') This would obviously work similarly with any higher level
// library (Express, etc)
http.createServer(function(req, res) {

  // If we hit the homepage, then we want to serve up some HTML - including the
  // server-side rendered React component(s), as well as the script tags
  // pointing to the client-side code
  if (req.url === '/') {

    res.setHeader('Content-Type', 'text/html; charset=utf-8')

    // `props` represents the data to be passed in to the React component for
    // rendering - just as you would pass data, or expose variables in
    // templates such as Jade or Handlebars.  We just use some dummy data
    // here (with some potentially dangerous values for testing), but you could
    // imagine this would be objects typically fetched async from a DB,
    // filesystem or API, depending on the logged-in user, etc.
    let props = {
			template: 'insurance1',
			cover: 'mothers',
      data: {
				perMonth: 1000,
	      years: 10,
	      interest: 0.05
      }
    }

    // Here we're using React to render the outer body, so we just use the
    // simpler renderToStaticMarkup function, but you could use any templating
    // language (or just a string) for the outer page template
    let html = ReactDOMServer.renderToStaticMarkup(body(null,

      // The actual server-side rendering of our component occurs here, and we
      // pass our data in as `props`. This div is the same one that the client
      // will "render" into on the browser from browser.js
      div({
        id: 'content',
        dangerouslySetInnerHTML: {__html: ReactDOMServer.renderToString(App(props))},
      }),

      // The props should match on the client and server, so we stringify them
      // on the page to be available for access by the code run in browser.js
      // You could use any let name here as long as it's unique
      script({
        dangerouslySetInnerHTML: {__html: 'let APP_PROPS = ' + safeStringify(props) + ';'},
      }),

      // We'll load React from a CDN - you don't have to do this,
      // you can bundle it up or serve it locally if you like
      script({src: 'https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/react-dom-factories@1.0.2/index.min.js'}),
      script({src: 'https://cdn.jsdelivr.net/npm/create-react-class@15.6.3/create-react-class.min.js'}),

      // Then the browser will fetch and run the browserified bundle consisting
      // of browser.js and all its dependencies.
      // We serve this from the endpoint a few lines down.
      script({src: '/bundle.js'})
    ))

	  console.log('HTML:')
	  console.log(html)
	  console.log('HTML:')
    // Return the page to the browser
    res.end(html)

  // This endpoint is hit when the browser is requesting bundle.js from the page above
  } else if (req.url === '/bundle.js') {

    res.setHeader('Content-Type', 'text/javascript')

    // If we've already bundled, send the cached result
    if (BUNDLE != null) {
      return res.end(BUNDLE)
    }

    // Otherwise, invoke browserify to package up browser.js and everything it requires.
    // We also use literalify to transform our `require` statements for React
    // so that it uses the global variable (from the CDN JS file) instead of
    // bundling it up with everything else
    browserify()
      .add('./browser.js')
      .transform(literalify.configure({
        'react': 'window.React',
        'react-dom': 'window.ReactDOM',
        'react-dom-factories': 'window.ReactDOMFactories',
        'create-react-class': 'window.createReactClass',
      }))
      .bundle(function(err, buf) {
        // Now we can cache the result and serve this up each time
        BUNDLE = buf
        res.statusCode = err ? 500 : 200
        res.end(err ? err.message : BUNDLE)
      })

  // Return 404 for all other requests
  } else {
    res.statusCode = 404
    res.end()
  }

// The http server listens on port 3000
}).listen(4000, function(err) {
  if (err) throw err
  console.log('Listening on http://localhost:4000')
})


// A utility function to safely escape JSON for embedding in a <script> tag
function safeStringify(obj) {
  return JSON.stringify(obj)
    .replace(/<\/(script)/ig, '<\\/$1')
    .replace(/<!--/g, '<\\!--')
    .replace(/\u2028/g, '\\u2028') // Only necessary if interpreting as JS, which we do
    .replace(/\u2029/g, '\\u2029') // Ditto
}
