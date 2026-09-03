(function attachFrameState(root, factory) {
  const api = factory();

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }

  root.ScrollFramePortfolio = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createFrameStateApi() {
  "use strict";

  function assertNode(node, index) {
    if (!Number.isInteger(node.startFrame) || !Number.isInteger(node.endFrame)) {
      throw new TypeError(`Node ${index} must use integer frame boundaries.`);
    }

    if (node.startFrame > node.endFrame) {
      throw new RangeError(`Node ${index} starts after it ends.`);
    }
  }

  class FrameSequenceState {
    constructor(nodes) {
      if (!Array.isArray(nodes) || nodes.length === 0) {
        throw new TypeError("At least one frame node is required.");
      }

      nodes.forEach(assertNode);
      this.nodes = Object.freeze(nodes.map((node) => Object.freeze({ ...node })));
      this.reset();
    }

    reset() {
      this.page = 0;
      this.frame = this.nodes[0].startFrame;
      this.pendingTransition = null;
      return this.snapshot();
    }

    snapshot() {
      return Object.freeze({
        page: this.page,
        frame: this.frame,
        pendingTransition: this.pendingTransition,
      });
    }

    advance(signedFrames) {
      if (!Number.isFinite(signedFrames) || signedFrames === 0 || this.pendingTransition) {
        return Object.freeze({ ...this.snapshot(), transition: null });
      }

      const direction = signedFrames > 0 ? 1 : -1;
      const amount = Math.max(1, Math.abs(Math.trunc(signedFrames)));
      const node = this.nodes[this.page];

      if (direction > 0) {
        this.frame = Math.min(node.endFrame, this.frame + amount);

        if (this.frame === node.endFrame && this.page < this.nodes.length - 1) {
          this.pendingTransition = "next";
        }
      } else {
        this.frame = Math.max(node.startFrame, this.frame - amount);

        if (this.frame === node.startFrame && this.page > 0) {
          this.pendingTransition = "previous";
        }
      }

      return Object.freeze({
        ...this.snapshot(),
        transition: this.pendingTransition,
      });
    }

    commitTransition() {
      if (this.pendingTransition === "next") {
        this.page += 1;
        this.frame = this.nodes[this.page].startFrame;
      } else if (this.pendingTransition === "previous") {
        this.page -= 1;
        this.frame = this.nodes[this.page].endFrame;
      }

      this.pendingTransition = null;
      return this.snapshot();
    }
  }

  return Object.freeze({ FrameSequenceState });
});
