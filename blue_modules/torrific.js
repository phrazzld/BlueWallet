import Tor from 'react-native-tor';
const tor = Tor();

/**
 * TOR wrapper mimicking Frisbee interface
 */
class Torsbee {
  baseURI = '';

  constructor(opts) {
    this.baseURI = opts.baseURI || this.baseURI;
  }

  async get(path, options) {
    console.log('TOR: starting...');
    const socksProxy = await tor.startIfNotStarted();
    console.log('TOR: started', await tor.getDaemonStatus(), 'on local port', socksProxy);
    if (path.startsWith('/') && this.baseURI.endsWith('/')) {
      // oy vey, duplicate slashes
      path = path.substr(1);
    }

    const response = {};
    try {
      const uri = this.baseURI + path;
      console.log('TOR: requesting', uri);
      const torResponse = await tor.get(uri, options?.headers || {}, true);
      response.originalResponse = torResponse;

      if (options?.headers['Content-Type'] === 'application/json' && torResponse.json) {
        response.body = torResponse.json;
      } else {
        response.body = Buffer.from(torResponse.b64Data, 'base64').toString();
      }
    } catch (error) {
      response.err = error;
      console.warn(error);
    }

    return response;
  }

  async post(path, options) {
    console.log('TOR: starting...');
    const socksProxy = await tor.startIfNotStarted();
    console.log('TOR: started', await tor.getDaemonStatus(), 'on local port', socksProxy);
    if (path.startsWith('/') && this.baseURI.endsWith('/')) {
      // oy vey, duplicate slashes
      path = path.substr(1);
    }

    const uri = this.baseURI + path;
    console.log('TOR: posting to', uri);

    const response = {};
    try {
      const torResponse = await tor.post(uri, JSON.stringify(options?.body || {}), options?.headers || {}, true);
      response.originalResponse = torResponse;

      if (options?.headers['Content-Type'] === 'application/json' && torResponse.json) {
        response.body = torResponse.json;
      } else {
        response.body = Buffer.from(torResponse.b64Data, 'base64').toString();
      }
    } catch (error) {
      response.err = error;
      console.warn(error);
    }

    return response;
  }

  async testSocket() {
    return new Promise((resolve, reject) => {
      (async () => {
        console.log('testSocket...');
        await tor.startIfNotStarted();
        const target = 'v7gtzf7nua6hdmb2wtqaqioqmesdb4xrlly4zwr7bvayxv2bpg665pqd.onion:50001';
        const conn = await tor.createTcpConnection({ target }, (data, err) => {
          if (err) {
            throw new Error(err);
          }
          const json = JSON.parse(data);
          if (!json || typeof json.result === 'undefined')
            reject(new Error('Unexpected response from TOR socket: ' + JSON.stringify(json)));

          conn.close();
          resolve();
        });

        await conn.write(
          `{ "id": 1, "method": "blockchain.scripthash.get_balance", "params": ["716decbe1660861c3d93906cb1d98ee68b154fd4d23aed9783859c1271b52a9c"] }\n`,
        );
      })();
    });
  }
}

/**
 * Wrapper for react-native-tor mimicking Socket class from NET package
 */
class TorSocket {
  constructor() {
    this._socket = false;
    this._listeners = {};
  }

  setTimeout() {}

  setEncoding() {}

  setKeepAlive() {}

  setNoDelay() {}

  on(event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    this._listeners[event].push(listener);
  }

  removeListener(event, listener) {
    this._listeners[event] = this._listeners[event] || [];
    const newListeners = [];

    let found = false;
    for (const savedListener of this._listeners[event]) {
      // eslint-disable-next-line eqeqeq
      if (savedListener == listener) {
        // found our listener
        found = true;
        // we just skip it
      } else {
        // other listeners should go back to original array
        newListeners.push(savedListener);
      }
    }

    if (found) {
      this._listeners[event] = newListeners;
    } else {
      // something went wrong, lets just cleanup all listeners
      this._listeners[event] = [];
    }
  }

  connect(port, host, callback) {
    console.log('connecting TOR socket...', host, port);
    (async () => {
      console.log('starting tor...');
      await tor.startIfNotStarted();
      console.log('started tor');
      const iWillConnectISwear = tor.createTcpConnection({ target: host + ':' + port, connectionTimeout: 15000 }, (data, err) => {
        if (err) {
          console.log('TOR socket onData error, closing: ', err);
          this._passOnEvent('close', err);
          return;
        }
        this._passOnEvent('data', data);
      });

      try {
        this._socket = await Promise.race([iWillConnectISwear, new Promise(resolve => setTimeout(resolve, 21000))]);
      } catch (e) {}

      if (!this._socket) {
        console.log('connecting TOR socket failed'); // either sleep expired or connect threw an exception
        this._passOnEvent('error', 'connecting TOR socket failed');
        return false;
      }

      console.log('TOR socket connected:', host, port);
      setTimeout(() => {
        this._passOnEvent('connect', true);
        callback();
      }, 1000);
    })();
  }

  _passOnEvent(event, data) {
    this._listeners[event] = this._listeners[event] || [];
    for (const savedListener of this._listeners[event]) {
      savedListener(data);
    }
  }

  emit(event, data) {}

  end() {
    console.log('trying to close TOR socket');
    if (this._socket && this._socket.close) {
      console.log('trying to close TOR socket SUCCESS');
      return this._socket.close();
    }
  }

  destroy() {}

  write(data) {
    if (this._socket && this._socket.write) {
      try {
        return this._socket.write(data);
      } catch (error) {
        console.log('this._socket.write() failed so we are issuing ERROR event', error);
        this._passOnEvent('error', error);
      }
    } else {
      console.log('TOR socket write error, socket not connected');
      this._passOnEvent('error', 'TOR socket not connected');
    }
  }
}

module.exports.Torsbee = Torsbee;
module.exports.Socket = TorSocket;
