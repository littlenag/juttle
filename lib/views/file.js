'use strict';

var TextView = require('./text');
var fs = require('fs');

// A file view is a text view with no arguments other than
// format 'json' and writing to a file.
class FileView extends TextView {
    constructor(options, env) {
        super(options, env);
        this.name = 'file';
        this.options.format = 'json';
        this.filename = options.filename;

        if (! this.filename) {
            throw new Error('File views require a -filename argument');
        }

        this.fstream = fs.createWriteStream(this.filename);
    }
}

module.exports = FileView;
