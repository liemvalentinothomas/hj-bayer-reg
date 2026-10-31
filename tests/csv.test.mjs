import test from 'node:test';import assert from 'node:assert/strict';import {csvCell} from '../lib/participants.ts';
test('CSV quotes commas quotes and line breaks',()=>{assert.equal(csvCell('A,"B"\nC'),'"A,""B""\nC"');});
test('CSV protects formulas including whitespace and phone numbers',()=>{for(const s of ['=1+1','+62812345678','-1+2','@SUM(A1)','  =1+2','\t=SUM(A1)'])assert.equal(csvCell(s),'"\''+s+'"');});
test('CSV multiple selections and structured values remain inspectable',()=>{assert.equal(csvCell(['A','B']),'"A; B"');assert.equal(csvCell(null),'""');});
