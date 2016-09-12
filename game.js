// Math for Game Developers
// Prototypes
function Position(x,y) {
  this.x = x;
  this.y = y;
  // Add the components of a vector to get a new position.
  this.add = function(vector) {
    return new Position((this.x + vector.x), (this.y + vector.y));
  };
}

// Can pass optional coords.
function Vector(endPoint, startPoint, coords) {
  if (coords) {
    this.x = coords.x;
    this.y = coords.y;
  } else {
    this.x = (endPoint.x + startPoint.x);
    this.y = (endPoint.y + startPoint.y);
  }
  // Scale the vector to move faster/slower.
  this.scale = function (scalar) {
    this.x *= scalar;
    this.y *= scalar;
  };
  // Magnitude is the length of the vector.
  this.magnitude = function () {
    return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2));
  };
  // Vectors are not aware of their own positions, so that is why
  // you can add or subtract vectors with/from other vectors.
  this.add = function (vector) {
    return new Vector(_,_,{x: (this.x + vector.x), y: (this.y + vector.y)});
  };
  this.subtract = function (vector) {
    return new Vector(_,_,{x: (this.x - vector.x), y: (this.y - vector.y)});
  };
}

// A unit vector is a vector with a magnitude of 1.
function UnitLengthVector(vector) {
  // Link UnitLengthVector to the Vector prototype.
  Vector.call(this, vector.x, vector.y);
  this.x = (vector.x / vector.magnitude());
  this.y = (vector.y / vector.magnitude());
}

// Pythagorean theorem for vectorLength
// a^2 = b^2 + c^2
// a is the hypotenuse (vectorLength).
// b is vector.x
// c is vector.y
// vectorLength^2 = vector.x^2 + vector.y^2
// Therefore, vectorLength = Math.sqrt(vector.x^2 + vector.y^2)
//           /
//          /.
//         / .
//        /...


// Helpers to compute physics
function velocity(accel, time) {
  return accel * time;
}

function time(velocity, accel) {
  return velocity / accel;
}

function distance(velocity, time) {
  return velocity * time;
}

// Helper to make a plan.
function makeTable(numRows,numCols) {
  var output = [];
  for (var i = 0; i < numRows; i++) {
    output.push([]);
    for (var j = 0; j < numCols; j++) {
      output[i].push('_');
    }
  }
  return output;
}

// Models
function Player () {
  this.x = 0;
  this.y = 0;
  this.accelerate = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
  };
  this.cacheOldPos = function() {
    this.oldPos = {x: this.x, y: this.y};
  };
}

function Bullet (player) {
  this.x = player.x;
  this.y = player.y-1;
  this.accelerate = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
  };
  this.cacheOldPos = function() {
    this.oldPos = {x: this.x, y: this.y};
  };
}

// Controller
function Game () {
  this.init = function(player) {
    this.setPlayer(player);
    this.setLayout(4,5);
    this.stylify();
  };
  this.setPlayer = function(player) {
    this.player = player || new Player();
    this.player.cacheOldPos();
  };
  this.setBullet = function(game,player) {
    return function() {
      var newBullet = new Bullet(player);
      game.layout[newBullet.y][newBullet.x] = '|';
      return newBullet;
    };
  };
  this.handleAcceleration = function() {
    View.$document.on('keydown', Handlers.acceleratePlayer(this.player));
    View.$document.on('keydown', Handlers.accelerateBullet(this.setBullet(this,this.player)));
  };
  this.setLayout = function(rows,cols) {
    this.layout = makeTable(rows,cols);
    this.layout[rows-1][parseInt(cols/2)] = '@';
    this.player.y = rows-1;
    this.player.x = parseInt(cols/2);
  };
  this.stylify = function() {
    this.styledLayout = this.layout.map(function(row) {
      return row.reduce(function(acc,cell) {
        var html;
        switch (cell) {
          case '@':
            return acc.append($("<td class=\'player cell\'></td>"));
          case '_':
            return acc.append($("<td class=\'space cell\'></td>"));
          case '|':
            return acc.append($("<td class=\'bullet cell\'></td>"));
        }
      }, $('<tr/>'));
    });
  };
  this.updateLayout = function() {
    // Update player position.
    this.layout[this.player.oldPos.y][this.player.oldPos.x] = '_';
    this.layout[this.player.y][this.player.x] = '@';
    // Update bullet position.
    if (this.bullet) {
      this.layout[this.bullet.oldPos.y][this.bullet.oldPos.x] = '_';
      this.layout[this.bullet.oldPos.y][this.bullet.oldPos.x] = '|';
    }
  };
}

var View = {
  // Filter key presses
  // Codes for direction.
  KEY_PRESS_CODES: {
    37: 4,
    38: 8,
    39: 6,
    40: 2,
    32: 'shoot'
  },
  filterKeyPress: function (event) {
    if (View.KEY_PRESS_CODES[event.which]) {
      return View.KEY_PRESS_CODES[event.which];
    }
  },
  pressed: {keyPress: null},
  // Coordinate changes per direction.
  coordinateChange: {
    4: {x: -1, y: 0},
    6: {x: 1, y: 0},
    2: {x: 0, y: 1},
    8: {x: 0, y: -1}
  },
  cacheDOM: function() {
    this.$document = $(document);
    this.$gameGrid = $('table#game-grid');
  },
  cacheGameData: function(game) {
    this.gameData = game;
    this.gameData.handleAcceleration();
  },
  render: function() {
    View.gameData.updateLayout();
    View.gameData.stylify();
    View.$gameGrid.empty();
    View.$gameGrid.append(View.gameData.styledLayout);
  }
};

// Handlers
var Handlers = {
  acceleratePlayer: function (player) {
    return function (ev) {
      var keyPress = View.filterKeyPress(ev);
      if (keyPress && keyPress !== 'shoot') {
        View.pressed.keyPress = keyPress;
        setTimeout(function() {
          // var vector = new Vector(coordinateChange[keyPress], player);
          player.cacheOldPos();
          player.accelerate(View.coordinateChange[keyPress]);
          window.requestAnimationFrame(View.render);
        },0);
      }
    };
  },
  accelerateBullet: function (bulletCallback) {
    return function (ev) {
      var keyPress = View.filterKeyPress(ev);
      if (keyPress && keyPress === 'shoot') {
        var bullet = bulletCallback();
        if (bullet.y >= 0) {
        setTimeout(function() {
            bullet.cacheOldPos();
            bullet.accelerate({x: 0, y: 1});
            window.requestAnimationFrame(View.render);
          },0);
        }
      }
    };
  }
};
