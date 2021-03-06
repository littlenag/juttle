'use strict';

var expect = require('chai').expect;
var juttle_test_utils = require('../../runtime/specs/juttle-test-utils');
var check_juttle = juttle_test_utils.check_juttle;

describe('Runaway program detection', function() {

    it('does not detect a runaway program from a live read', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end:',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('detects a runaway program from a live read to a tail 1', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | tail 1 '
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
            // verify the exact location information so we know its 
            // pointing the finger at the `read` proc
            expect(err.info.location).to.deep.equal({
                filename: 'main',
                start: {
                    line: 1,
                    column: 1,
                    offset: 0
                },
                end: {
                    line: 1,
                    column: 32,
                    offset: 31 
                }
            });
        });
    });

    it('detects a runaway program from a superquery read to a tail 1', () => {
        return check_juttle({
            program: 'read test -key "foo" -from :0: -to :end: | tail 1 '
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('does not detect a runaway program from a live read with batch to a tail 1', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | batch -every :1s: | tail 1 ',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('detects a runaway program from a live read to sort', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | sort field'
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('detects a runaway program from a superquery read to sort', () => {
        return check_juttle({
            program: 'read test -key "foo" -from :0: -to :end: | sort field'
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('does not detect a runaway program from a live read with batch to sort', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | put field=count() | batch -every :1s: | sort field ',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('does not detect a runaway program from a live read with reduce -every', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | reduce -every :1s: count()',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('does not detect a runaway program from a live read with batch to reduce', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | batch :1s: | reduce count() ',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('does not detect a runaway program from a historical read to reduce', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :now: | reduce count() ',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });

    it('detects a runaway program when there are multiple read sources', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | reduce count() | view results1; read test -key "foo" -last :1m: | reduce count() | view results2'
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('detects a runaway program when there are multiple levels of procs used', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | put a = count() | filter foo="bar" | reduce count() | put a = count()'
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('detects a runaway program when there are multiple reducers and one without -every', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | reduce -every :1s: count() | reduce max(m)'
        })
        .then((results) => {
            throw Error('runaway detector failed to catch');
        })
        .catch((err) => {
            expect(err.code).to.equal('RUNAWAY-PROGRAM');
        });
    });

    it('does not detect a runaway program from a live read to head', () => {
        return check_juttle({
            program: 'read test -key "foo" -to :end: | head 1',
            deactivateAfter: 50 // stop the live program after 50ms
        })
        .then((results) => {
            expect(results.errors).to.deep.equal([]);
            expect(results.warnings).to.deep.equal([]);
        });
    });
});
