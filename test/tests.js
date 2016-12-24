'use strict';
var SRJson = require('../index');
var expect = require('chai').expect;

describe('Self referenced json tests', function() {

    describe('basic tests', function() {

        it('should be able to parse value reference', function() {
            var testJson = "{ \"propA\": { \"propInsideA\": 20 }, \"propB\": \"$(propA.propInsideA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal(20);
        });

        it('should be able to parse value reference, value changed won\'t affect the origin value', function() {
            var testJson = "{ \"propA\": { \"propInsideA\": 20 }, \"propB\": \"$(propA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB.propInsideA).to.equal(20);
            resultObj.propB.propInsideA = 30;
            expect(resultObj.propA.propInsideA).to.equal(20); // remains 20
        });

        it('should be able to parse obj reference', function() {
            var testJson = "{ \"propA\": { \"propInsideA\": 20 }, \"propB\": \"&(propA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB.propInsideA).to.equal(20);
            resultObj.propB.propInsideA = 30;
            expect(resultObj.propA.propInsideA).to.equal(30);
        });

        it('should be able to parse mustache values', function() {
            var testJson = "{ \"propA\": { \"propInsideA\": 20 }, \"propB\": \"value is: {{ propA.propInsideA }} - {{ propA.propInsideA }}\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal("value is: 20 - 20");
        });
    });

    describe('array support', function() {

        it('should be able to reference array by value', function() {
            var testJson = "{ \"propA\": [ 20, { \"propInsideA\": 30 } ], \"propB\": \"$(propA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB[1].propInsideA).to.equal(30);
            resultObj.propB[1].propInsideA = 40;
            expect(resultObj.propA[1].propInsideA).to.equal(30);
        });

        it('should be able to reference array by reference', function() {
            var testJson = "{ \"propA\": [ 20, { \"propInsideA\": 30 } ], \"propB\": \"&(propA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB[1].propInsideA).to.equal(30);
            resultObj.propB[1].propInsideA = 40;
            expect(resultObj.propA[1].propInsideA).to.equal(40);
            resultObj.propB[0] = 30;
            expect(resultObj.propA[0]).to.equal(30);
        });

        it('should be able to reference by index', function() {
            var testJson = "{ \"propA\": [ 20, { \"propInsideA\": 30 } ], \"propB\": \"$(propA[0])\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal(20);
        });

        it('should be able to reference by index for object, too (double quote)', function() {
            var testJson = "{ \"propA\": { \"prop-InsideA-bbqq\": 30 }, \"propB\": \"$(propA[\\\"prop-InsideA-bbqq\\\"])\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal(30);
        });

        it('should be able to reference by index for object, too (single quote)', function() {
            var testJson = "{ \"propA\": { \"prop-InsideA-bbqq\": 30 }, \"propB\": \"$(propA['prop-InsideA-bbqq'])\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal(30);
        });

        it('should be able to reference things inside array', function() {
            var testJson = '{ "propA": 20, "propB": { "propInsideB": 30 }, "propC": [ "$(propA)", "&(propB)" ] }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propC[0]).to.equal(20);
            expect(resultObj.propC[1].propInsideB).to.equal(30);
            resultObj.propC[1].propInsideB = 40;
            expect(resultObj.propB.propInsideB).to.equal(40);
        })
    });

    describe('the resolving is from top to bottom', function() {
        it('should be able to solve referencing each other', function() {
            var testJson = "{ \"propA\": \"&(propB)\", \"propB\": \"&(propA)\" }";
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propA).to.equal('&(propA)');
        });

        it('should not be able to resolve chained reference ONCE', function() {
            var testJson = '{ "propA": "&(propB)", "propB": "&(propC)", "propC": { "propInsideC": 20 } }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propA).to.equal('&(propC)');
        });

        it('should be able to resolve chained reference several times', function() {
            var testJson = '{ "propA": "&(propB)", "propB": "&(propC)", "propC": { "propInsideC": 20 } }';
            var resultObj = SRJson.render(testJson, { renderTimes: 2 } );
            expect(resultObj.propA).to.not.equal('&(propC)');
            expect(resultObj.propA.propInsideC).to.equal(20);
            resultObj.propA.propInsideC = 30;
            expect(resultObj.propB.propInsideC).to.equal(30);
            expect(resultObj.propC.propInsideC).to.equal(30);
        });
    });

    describe('abnormal tests', function() {
        it('should be able to handle circular reference using $', function() {
            var testJson = '{ "propA": { "propInsideA": "$(propA)" } }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propA.propInsideA.propInsideA).to.equal('$(propA)');
        });

        it('should be able to handle circular reference using &', function() {
            var testJson = '{ "propA": { "propInsideA": "&(propA)" } }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propA.propInsideA.propInsideA).to.not.equal('$(propA)');
            expect(resultObj.propA.propInsideA.propInsideA).to.equal(resultObj.propA);
        });

        it('should not be able to render invalid property reference', function() {
            var testJson = '{ "propA": 20, "propB": "$(propA"}';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.not.equal(20);
            expect(resultObj.propB).to.equal('$(propA');
        });

        it('should not be able to render empty reference', function() {
            var testJson = '{ "propA": 20, "propB": "$()", "propC": "&()", "propD": "{{}} fef {{  }}" }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.equal('$()');
            expect(resultObj.propC).to.equal('&()');
            expect(resultObj.propD).to.equal('{{}} fef {{  }}');
        });

        it('should not be able to render non-existent property reference', function() {
            var testJson = '{ "propA": 20, "propB": "$(propC.propInsideC)"}';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.not.equal(20);
            expect(resultObj.propB).to.equal('$(propC.propInsideC)');
        });

        it('should not be able to render invalid mustache reference', function() {
            var testJson = '{ "propA": 20, "propB": "hahaha {{propC.propInsideC}} {{ propA }}{{propD}}}}{}{{}}{{" }';
            var resultObj = SRJson.render(testJson);
            expect(resultObj.propB).to.not.equal(20);
            expect(resultObj.propB).to.equal('hahaha {{propC.propInsideC}} 20{{propD}}}}{}{{}}{{');
        });
    });

    it('example', function() {
        var testJson = require('fs').readFileSync(require('path').resolve(__dirname, './myTemplate.json'), 'utf-8');
        var resultObj = SRJson.render(testJson);
        expect(resultObj.window.help_window.size.height).to.equal(600);
        expect(resultObj.window.help_window.size.width).to.equal(800);
        expect(resultObj.window.help_window.title).to.equal('My APP');
        expect(resultObj.texts.warning).to.equal('windows size should be 800x600');
    });
});