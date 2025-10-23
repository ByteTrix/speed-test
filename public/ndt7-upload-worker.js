/* eslint-env browser, node, worker */

// Node doesn't have WebSocket defined, so it needs this library.
if (typeof WebSocket === 'undefined') {
  global.WebSocket = require('ws');
}

// workerMain is the WebWorker function that runs the ndt7 upload test.
const workerMain = function(ev) {
  'use strict';
  const url = ev.data['///ndt/v7/upload'];
  const sock = new WebSocket(url, 'net.measurementlab.ndt.v7');
  let now;
  if (typeof performance !== 'undefined' &&
      typeof performance.now === 'function') {
    now = () => performance.now();
  } else {
    now = () => Date.now();
  }
  uploadTest(sock, postMessage, now);
};

/**
 * uploadTest is a function that runs an ndt7 upload test using the
 * passed-in websocket instance and the passed-in callback function.  The
 * socket and callback are passed in to enable testing and mocking.
 *
 * @param {WebSocket} sock - The WebSocket being written to.
 * @param {function} postMessage - A function for messages to the main thread.
 * @param {function} now - A function returning a time in milliseconds.
 */
const uploadTest = function(sock, postMessage, now) {
  sock.onclose = function() {
    postMessage({
      MsgType: 'complete',
    });
  };

  sock.onerror = function(ev) {
    postMessage({
      MsgType: 'error',
      Error: ev.type,
    });
  };

  let start = now();
  let previous = start;
  let total = 0;

  sock.onopen = function() {
    start = now();
    previous = start;
    total = 0;
    postMessage({
      MsgType: 'start',
      Data: {
        ClientStartTime: start,
      },
    });

    const chunkSize = 8192;
    const chunk = new Uint8Array(chunkSize);
    const maxRuntime = 10000; // 10 seconds

    const sendData = function() {
      const t = now();
      if (t - start > maxRuntime) {
        sock.close();
        return;
      }

      if (sock.bufferedAmount >= 7 * chunkSize) {
        setTimeout(sendData, 0);
        return;
      }

      sock.send(chunk);
      total += chunkSize;

      // Perform a client-side measurement 4 times per second.
      const every = 250; // ms
      if (t - previous > every) {
        postMessage({
          MsgType: 'measurement',
          ClientData: {
            ElapsedTime: (t - start) / 1000, // seconds
            NumBytes: total,
            MeanClientMbps: (total / (t - start)) * 0.008,
          },
          Source: 'client',
        });
        previous = t;
      }

      setTimeout(sendData, 0);
    };
    sendData();
  };

  sock.onmessage = function(ev) {
    // Pass along every server-side measurement.
    if (typeof ev.data === 'string') {
      postMessage({
        MsgType: 'measurement',
        ServerMessage: ev.data,
        Source: 'server',
      });
    }
  };
};

// Node and browsers get onmessage defined differently.
if (typeof self !== 'undefined') {
  self.onmessage = workerMain;
} else if (typeof this !== 'undefined') {
  this.onmessage = workerMain;
} else if (typeof onmessage !== 'undefined') {
  onmessage = workerMain;
}
