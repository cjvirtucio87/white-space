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
  this.y = player.y;
  this.accelerate = function (vector) {
    this.x += vector.x;
    this.y += vector.y;
  };
  this.cacheOldPos = function() {
    this.oldPos = {x: this.x, y: this.y};
  };
}

function Enemy () {
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
      game.bullet = newBullet;
      return newBullet;
    };
  };
  this.setEnemy = function(game) {
    return function() {
      var newEnemy = new Enemy();
      newEnemy.x = parseInt(game.layout[0].length/2);
      newEnemy.y = 0;
      game.layout[0][newEnemy.x] = '&';
      game.enemy = newEnemy;
      game.enemy.cacheOldPos();
      return newEnemy;
    };
  };
  this.handleAcceleration = function() {
    View.$document.on('keydown', Handlers.acceleratePlayer(this.player));
    View.$document.on('keydown', Handlers.accelerateBullet(this.setBullet(this,this.player)));
    Handlers.accelerateEnemy(this.setEnemy(this))();
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
            return acc.append($("<td class=\'cell\'></td>"));
          case '|':
            return acc.append($("<td class=\'bullet cell\'></td>"));
          case '&':
            return acc.append($("<td class=\'enemy cell\'></td>"));
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
      if (this.layout[this.bullet.oldPos.y][this.bullet.oldPos.x] !== '@') {
        this.layout[this.bullet.oldPos.y][this.bullet.oldPos.x] = '_';
      }
      this.layout[this.bullet.y][this.bullet.x] = '|';
    } if (this.enemy) {
      if (this.layout[this.enemy.oldPos.y][this.enemy.oldPos.x] !== '@') {
        this.layout[this.enemy.oldPos.y][this.enemy.oldPos.x] = '_';
      }
      this.layout[this.enemy.y][this.enemy.x] = '&';
    }
  };
  this.clearBullet = function() {
    this.layout[this.bullet.y+1][this.bullet.x] = '_';
    this.bullet = null;
  };
  this.clearEnemy = function() {
    this.layout[this.enemy.y-1][this.bullet.x] = '_';
    this.enemy = null;
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
  validateMovement: function (keyPress, player) {
    var endPoint = {x: player.x + View.coordinateChange[keyPress].x,
                    y: player.y + View.coordinateChange[keyPress].y};
    return View.validateMovementBounds(keyPress,player) && View.validateCollision(endPoint);
  },
  validateMovementBounds: function (keyPress, player) {
    switch (keyPress) {
      case 4:
        return player.x > 0;
      case 6:
        return player.x < View.gameData.layout[0].length-1;
      case 8:
        return player.y > 0;
      case 2:
        return player.y < View.gameData.layout.length-1;
    }
  },
  validateCollision: function(endPoint) {
    return View.gameData.layout[endPoint.y][endPoint.x] === '_';
  },
  pressed: {keyPress: null},
  bullets: [],
  enemies: [],
  // Change in coordinates per direction.
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

// Event handlers. Also has validations for keypresses.
var Handlers = {
  acceleratePlayer: function (player) {
    return function (ev) {
      var keyPress = View.filterKeyPress(ev);
      if (keyPress && keyPress !== 'shoot' && View.validateMovement(keyPress, player)) {
        View.pressed.keyPress = keyPress;
        var playerAccelCallback = function() {
          // var vector = new Vector(coordinateChange[keyPress], player);
          player.cacheOldPos();
          player.accelerate(View.coordinateChange[keyPress]);
          window.requestAnimationFrame(View.render);
        };
        setTimeout(playerAccelCallback,0);
      }
    };
  },
  accelerateBullet: function (bulletCallback) {
    return function (ev) {
      var keyPress = View.filterKeyPress(ev);
      // Validate key press and bullet count on screen.
      if (keyPress && keyPress === 'shoot' && View.bullets.length === 0) {
        var bullet = bulletCallback();
        View.bullets.push(bullet);
        var bulletAccelCallback = function () {
          bullet.cacheOldPos();
          bullet.accelerate({x: 0, y: -1});
          window.requestAnimationFrame(View.render);
          // Recursively queue up the bullet accel if within bounds.
          if (bullet.y >= 0 && View.bullets.length <= 1) {
            setTimeout(bulletAccelCallback,500);
          } else {
            View.bullets.pop();
            View.gameData.clearBullet();
            window.requestAnimationFrame(View.render);
          }
        };
        if (bullet.y >= 0) {
          setTimeout(bulletAccelCallback,0);
        }
      }
    };
  },
  accelerateEnemy: function (enemyCallback) {
    return function () {
      var enemy = enemyCallback();
      var enemyAccelCallback = function () {
        enemy.cacheOldPos();
        enemy.accelerate({x: 0, y: 1});
        window.requestAnimationFrame(View.render);
        // Recursively queue up the enemy accel if within bounds.
        if (enemy.y >= 0 && View.enemies.length <= 1) {
          setInterval(enemyAccelCallback,500);
        } else {
          View.enemies.pop();
          View.gameData.clearEnemy();
          window.requestAnimationFrame(View.render);
        }
      };
      if (enemy.y <= View.gameData.length-1) {
        setInterval(enemyAccelCallback,500);
      }
    };
  }
};
