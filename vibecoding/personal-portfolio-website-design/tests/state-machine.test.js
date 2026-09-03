"use strict";

const assert = require("node:assert/strict");
const { FrameSequenceState } = require("../frame-state.js");

const state = new FrameSequenceState([
  { startFrame: 1, endFrame: 300 },
  { startFrame: 301, endFrame: 600 },
]);

assert.deepEqual(state.snapshot(), {
  page: 0,
  frame: 1,
  pendingTransition: null,
});

const pageOneBoundary = state.advance(299);
assert.equal(pageOneBoundary.page, 0);
assert.equal(pageOneBoundary.frame, 300);
assert.equal(pageOneBoundary.transition, "next");

state.commitTransition();
assert.equal(state.page, 1);
assert.equal(state.frame, 301);

const reverseBoundary = state.advance(-1);
assert.equal(reverseBoundary.frame, 301);
assert.equal(reverseBoundary.transition, "previous");

state.commitTransition();
assert.equal(state.page, 0);
assert.equal(state.frame, 300);

state.advance(1);
state.commitTransition();
state.advance(299);
assert.equal(state.page, 1);
assert.equal(state.frame, 600);
assert.equal(state.pendingTransition, null);

state.advance(20);
assert.equal(state.frame, 600);

console.log("State-machine boundary tests passed for 1–300 / 301–600.");
