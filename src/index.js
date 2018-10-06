const uuidv4 = require("uuid/v4");
import { flattenDeep, compact } from "lodash";

const pressedColor = "#00B324";
class Key {
  constructor(x, y, width, height, type) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.type = type;
    this.pressed = false;
  }

  draw() {
    if (this.type === "white") {
      this.drawWhiteKey(ctx, this.x, this.y, this.width, this.height);
    }

    if (this.type === "black") {
      this.drawBlackKey(ctx, this.x, this.y, this.width, this.height);
    }
  }

  drawWhiteKey(ctx, x, y, w, h) {
    if (this.pressed) {
      ctx.fillStyle = pressedColor;
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(x, y, w, h);
    } else {
      ctx.fillStyle = "white";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(x, y, w, h);
    }
  }

  drawBlackKey(ctx, x, y, w, h) {
    if (this.pressed) {
      ctx.fillStyle = pressedColor;
      ctx.fillRect(x, y, w, h);
    } else {
      ctx.fillStyle = "black";
      ctx.fillRect(x, y, w, h);
    }
  }
}

class Keyboard {
  constructor(x, y, numberOfOctaves = 1) {
    this.x = x;
    this.y = y;
    this.keys = [];
    this.numberOfOctaves = numberOfOctaves;
    this.generateKeys();
  }

  draw() {
    this.keys.forEach(k => k.draw());
  }

  generateKeys() {
    let originalStart = this.x;
    let startX = originalStart;
    let startY = this.y;
    for (let n = 0; n < this.numberOfOctaves; n++) {
      let blackStartX = startX;
      let dx = 16;
      let wHeight = 60;
      let whiteNames = ["C", "D", "E", "F", "G", "A", "B"];
      let blackNames = ["C#", "D#", "F#", "G#", "A#"];

      for (let i = 0; i < 7 * 1; i++) {
        let key = new Key(startX, startY, dx, wHeight, "white");
        this.keys.push(key);

        startX += dx;
      }

      let blackKeys = [1, 1, 0, 1, 1, 1];
      let bHeight = 40;
      let bDx = dx / 4;
      for (let i = 0; i < blackKeys.length; ++i) {
        if (blackKeys[i] === 1) {
          let key = new Key(
            blackStartX + bDx * 3,
            startY,
            bDx * 2,
            bHeight,
            "black"
          );
          this.keys.push(key);
          // key.draw();
        }
        blackStartX += dx;
      }
    }
  }
}

class WidgetCache {
  constructor() {
    this.nodes = {};
  }

  addNode(id, node) {
    this.nodes[id] = node;
  }

  getNode(id) {
    return this.nodes[id];
  }

  removeNode(id) {
    delete this.nodes[id];
  }

  get allNodes() {
    return this.nodes;
  }
}

class Widget {
  constructor(x, y) {
    this._x = x || 0;
    this._y = y || 0;
    this.parent = null;
    this.children = [];
    this.id = uuidv4();
    this.stage = null;
  }

  addChild(child) {
    this.children.push(child);
  }

  addToStage(stage) {
    this.stage = stage;
  }

  get offsets() {
    return {
      x: this.stage.ctx.width - this._x,
      y: this.stage.ctx.height - this._y
    };
  }

  get bbox() {
    const { _x, _y } = this;
    return [{ x: _x, y: _y, w: _x, h: _y }].concat(
      this.children.map(c => c.bbox)
    );
  }

  get absoluteBbox() {
    const { id, x, y } = this;
    return [{ id, x, y, absW: x, absH: y }].concat(
      this.children.map(c => c.absoluteBbox)
    );
  }

  get position() {
    return { x: this._x, y: this._y };
  }

  get childPositions() {
    const parentPos = [this.position];
    return parentPos.concat(this.children.map(c => c.childPositions));
  }

  set x(value) {
    this._x = value;
  }

  set y(value) {
    this._y = value;
  }

  setPosition({ x, y }) {
    this._x = this.parent.x + x;
    this._y = this.parent.y + y;
  }

  draw(ctx) {
    this.children.forEach(x => x.draw(ctx));
  }

  // onMouseUp(e, item) {}

  // onMouseDown(e, item) {}

  // onMouseMove(e, item) {}
}

class Box extends Widget {
  constructor(parent, w, h) {
    super(parent.x, parent.y);
    this.parent = parent;
    parent.addChild(this);
    this.w = w;
    this.h = h;
    this._color = "#FF0000";
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    const { _x, _y, w, h } = this;
    ctx.fillRect(_x, _y, w, h);
  }

  set color(value) {
    this._color = value;
  }

  get color() {
    return this._color;
  }

  get bbox() {
    const { x, y, w, h } = this;
    return { x, y, w, h };
  }

  get absoluteBbox() {
    const { _x, _y, wx, hy, id } = this;
    return { id, x: _x, y: _y, absW: wx, absH: hy };
  }

  get wx() {
    return this._x + this.w;
  }

  get hy() {
    return this._y + this.h;
  }
}

class Stage {
  constructor(ctx, w, h) {
    this.w = h;
    this.h = h;
    this.nodes = [];
    this.ctx = ctx;
    this.handle = {
      x: 0,
      y: 0,
      w: 0,
      h: 0
    };

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  addNode(node) {
    node.addToStage(this);
    this.nodes.push(node);
  }

  draw() {
    this.ctx.fillStyle = "#454545";
    this.ctx.fillRect(0, 0, this.w, this.h);
    this.nodes.forEach(n => n.draw(this.ctx));
  }

  onMouseMove(event) {
    console.log(this.handle);
    const node = Factory.getNode(this.handle.id);
    node.x = event.clientX;
    node.y = event.clientY;
    console.log(node.id);
    console.log(node);
    this.draw();
  }

  onMouseUp(event) {
    document.body.removeEventListener("mousemove", this.onMouseMove);
    document.body.removeEventListener("mouseup", this.onMouseUp);
  }

  boxCollision(x, y, handle) {
    return (
      x >= handle.x && x <= handle.absW && y >= handle.y && y <= handle.absH
    );
  }

  getNodeBoxes() {
    const boxes = this.nodes.map(node => node.absoluteBbox);
    const nodePositions = flattenDeep(boxes);
    console.log(nodePositions, "POSITIONS");
    // console.log(JSON.stringify(nodePositions));
    return nodePositions;
  }

  listen() {
    console.log("listening");
    document.body.addEventListener("mousedown", event => {
      //find all nodes and ckeck for collision
      let bboxes = this.getNodeBoxes();
      bboxes = bboxes.map(b => {
        if (this.boxCollision(event.clientX, event.clientY, b)) {
          console.log("COLLISSION", b, event.clientX, event.clientY);
          return b;
        } else {
          return null;
        }
      });

      console.log(bboxes, "BEFORE FLATTEN");
      bboxes = compact(flattenDeep(bboxes));
      console.log(bboxes, "AFTER FLATTEN");

      if (bboxes.length > 0) {
        console.log(bboxes[0], "TO BE HANDLE");
        this.handle = bboxes[0];
        document.body.addEventListener("mousemove", this.onMouseMove);
        document.body.addEventListener("mouseup", this.onMouseUp);
      } else {
        console.log(false);
      }
    });
  }

  update() {
    this.listen();
  }
}

const Factory = {
  cache: new WidgetCache(),
  getNode(id) {
    return this.cache.getNode(id);
  },
  removeNode(id) {
    this.cache.removeNode(id);
  },
  mWidget(x, y) {
    const widget = new Widget(x, y);
    this.cache.addNode(widget.id, widget);
    return widget;
  },
  mBox(parent, w, h) {
    const box = new Box(parent, w, h);
    this.cache.addNode(box.id, box);
    return box;
  }
};

function init() {
  const canvas = document.querySelector("canvas");
  canvas.width = 800;
  canvas.height = 600;
  var ctx = canvas.getContext("2d");

  let stage = new Stage(ctx, canvas.width, canvas.height);

  // let keyboard2 = new Keyboard(20, 20, 6);
  // keyboard2.keys[0].pressed = true;
  // keyboard2.keys[8].pressed = true;
  // keyboard2.keys[11].pressed = true;
  // keyboard2.draw(6);

  let p = Factory.mWidget(20, 100);
  let box = Factory.mBox(p, 200, 200);
  box.color = "blue";

  let box2 = Factory.mBox(p, 50, 50);
  box2.color = "white";
  box2.setPosition({ x: 20, y: 20 });

  let box3 = Factory.mBox(p, 75, 75);
  box3.color = "green";
  box3.setPosition({ x: 50, y: 50 });

  stage.addNode(p);

  stage.draw();
  stage.update();
}

init();
