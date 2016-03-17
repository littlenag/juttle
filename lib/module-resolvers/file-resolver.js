'use strict';

/* eslint-env node */
var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var logger = require('../logger').getLogger('file-resolver');

function search_paths() {
    var env = process.env;
    var paths = [];
    if (env.JUTTLE_MODULE_PATH) {
        paths = paths.concat(env.JUTTLE_MODULE_PATH.split(':'));
    }
    return paths;
}

class FileResolver {
    constructor(options) {
        var self = this;

        options = options || {};

        // stdlib is always available
        self._search_paths = [path.join(__dirname, '../stdlib/')];

        self._additional_search_paths = options.search_paths || search_paths();

        self.resolve = self._resolve.bind(self);
    }

    _is_file(module_path) {
        try {
            var stats = fs.statSync(module_path);
            return stats.isFile();
        } catch (e) {
            return false;
        }
    }

    _canonicalize(filename) {
        // If the filename is actually a directory, add a
        // /index.juttle
        if (fs.existsSync(filename)) {
            let stats = fs.statSync(filename);
            if (stats.isDirectory()) {
                filename = path.join(filename, 'index.juttle');
            }
        }

        if (path.extname(filename) !== '.juttle') {
            filename = filename + '.juttle';
        }

        return filename;
    }

    _is_local_import(module_path) {
        return (module_path.startsWith('./') ||
                module_path.startsWith('../') ||
                path.isAbsolute(module_path));
    }

    _search_local_import(module_path, module_name, importer_path) {
        var self = this;

        logger.debug(`searching local module_path=${module_path} module_name=${module_name} importer_path=${importer_path}`);

        // Resolve module_path relative to importer_path or the
        // current working directory.
        let dir = process.cwd();
        if (importer_path !== undefined &&
            path.isAbsolute(importer_path)) {
            // importer_path can be non-absolute when the program has
            // a generic name like 'main'. That in turn happens for
            // programs in the cli repl or when provided via -e.

            dir = path.dirname(importer_path);
        }

        // Note this won't change module_path if it is already
        // absolute.
        let filename = path.resolve(dir, module_path);
        filename = self._canonicalize(filename);
        try {
            return {
                source: fs.readFileSync(filename, 'utf8'),
                name: filename
            };
        }
        catch (e) {
            return false;
        }
    }

    _search_system_import(module_path, module_name, importer_path) {
        var self = this;

        logger.debug(`searching system module_path=${module_path} module_name=${module_name} importer_path=${importer_path}`);

        var k, paths = self._search_paths;
        paths = paths.concat(self._additional_search_paths);
        for (k = 0; k < paths.length; ++k) {
            var filename = paths[k] + '/' + module_path;

            filename = self._canonicalize(filename);

            if (self._is_file(filename)) {
                try {
                    return {
                        name: module_path,
                        source: fs.readFileSync(filename, 'utf8')
                    };
                }
                catch (e) {
                    // continue looking for a module we can successfully load
                }
            }
        }
        return false;
    }

    _resolve(module_path, module_name, importer_path) {
        var self = this;

        var found = false;
        if (self._is_local_import(module_path)) {
            found = self._search_local_import(module_path, module_name, importer_path);
        } else {
            found = self._search_system_import(module_path, module_name, importer_path);
        }
        if (found === false) {
            return Promise.reject(new Error('could not find module: ' + module_path));
        }
        return Promise.resolve(found);
    }
}

module.exports = FileResolver;
