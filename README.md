# TY AE to WebGL

[![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

This is a command line application to export After Effects files as JSON.

Currently this only works on osx due to the fact that the module [`after-effects`](https://www.npmjs.com/package/after-effects) uses Apple Script to execute JSX files.

## Usage

[![NPM](https://nodei.co/npm/ae-to-json-cli.png)](https://www.npmjs.com/package/ae-to-json-cli)

### Install
```bash
$ npm install
```

The following will export the currently opened After Effects file as a JSON file in OSX:
```bash
$ node index.js
```
