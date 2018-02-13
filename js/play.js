App.play = function (game) {}

App.play.prototype.create = function() {

    console.log(
        "%c %c %c Starting Game! Yay!                             %c %c ",
        "background: #ffb740;",
        "background: #ff9620;",
        "color: #fff; background: #ee7600;",
        "background: #ff8720;",
        "background: #ffb740;"
    )

    this.game.stage.backgroundColor = "#555555"

    this.drawLevel(0)
    this.drawOverlay()

    this.inputMan = new GameInput(this.game, this)
    this.inputMan.initSwipe()
    this.inputMan.initKeys()

    this.resize()

}

App.play.prototype.resize = function() {

    App.gameScale = this.game.width < this.game.height
        ? this.game.width/(8*TILES)
        : this.game.height/(8*TILES)
    
    App.playMin = this.game.width < this.game.height
        ? this.game.width
        : this.game.height

    this.fixedGroup.scale.setTo(App.gameScale, App.gameScale)
    this.moveableGroup.scale.setTo(App.gameScale, App.gameScalea)

    this.fixedGroup.x =
    this.moveableGroup.x = Math.round((this.game.width-App.playMin)/2)
    this.fixedGroup.y =
    this.moveableGroup.y = Math.round((this.game.height-App.playMin)/2)

    this.levelText.fontSize = 
    this.scoreText.fontSize = 24*App.gameScale

    this.levelText.x =
    this.scoreText.x = this.game.width/2
    this.scoreText.y = this.game.height

}

App.play.prototype.drawLevel = function (level) {

    this.level = level = level || this.level || 0
    this.map = this.cache.getJSON("levels").maps[level].map(function(arr) {
        return arr.slice()
    })
    
    if (this.fixedGroup) {
        this.fixedGroup.destroy()
    }
    if (this.moveableGroup) {
        this.moveableGroup.destroy()
    }

    this.player =  null
    this.crates = []
    this.crateCount = 0
    this.filledSpots = 0
    this.moves = 0

    this.undoStack = []

    this.fixedGroup = this.game.add.group()
    this.moveableGroup = this.game.add.group()

    var currentTile = null
    var tileX = 0
    var tileY = 0

    for (var y = 0; y < this.map.length; y++) {
        this.crates[y] = []
        for (var x = 0; x < this.map[y].length; x++) {
            this.crates[y][x] = null
            currentTile = this.map[y][x]
            tileX = x * TILES
            tileY = y * TILES

            if ( currentTile === SPOT
              || currentTile === SPOT+PLAYER
              || currentTile === SPOT+CRATE
              || currentTile === WALL) {
                this.game.add.sprite(tileX, tileY, "tiles", currentTile === WALL ? WALL : SPOT, this.fixedGroup)
            }

            if (currentTile === CRATE || currentTile === SPOT+CRATE) {
                this.crates[y][x] = this.game.add.sprite(tileX, tileY, "tiles", currentTile, this.moveableGroup)
                this.crates[y][x].isMoving = false
                this.crateCount++
            }

            if (currentTile === PLAYER || currentTile === SPOT+PLAYER) {
                this.player = this.game.add.sprite(tileX, tileY, "tiles", currentTile, this.moveableGroup)
                this.player.posX = x
                this.player.posY = y
                this.player.isMoving = false
            }

            if (currentTile === EMPTY || currentTile === CRATE || currentTile === PLAYER) {
                this.game.add.sprite(tileX, tileY, "tiles", EMPTY, this.fixedGroup)
            }
        }
    }
}

App.play.prototype.drawOverlay = function () {
    if (this.overlayGroup) {
        this.overlayGroup.destroy()
    }

    this.overlayGroup = this.game.add.group()

    this.levelText = this.game.add.text(
        this.game.width/2,
        0,
        "Level " + (this.level+1),
        {
            font: "bold 24px Helvetica",
            fill: "#ffffff"
        },
        this.overlayGroup
    )
    this.levelText.anchor.setTo(0.5, 0)

    this.scoreText = this.game.add.text(
        this.game.width/2,
        this.game.height,
        "Moves: " + this.moves,
        {
            font: "bold 24px Helvetica",
            fill: "#ffffff"
        },
        this.overlayGroup
    )
    this.scoreText.anchor.setTo(0.5, 1)
}

App.play.prototype.isClear = function (x, y) {
    return this.map[y][x] === EMPTY || this.map[y][x] === SPOT
}

App.play.prototype.isCrate = function(x, y) {
    return this.map[y][x] === CRATE || this.map[y][x] === SPOT+CRATE
}

App.play.prototype.movePlayer = function (deltas, logMove) {
    logMove = logMove === false ? false : true

    if (this.player.isMoving) {
        return false
    }

    var dX = deltas[0]
    var dY = deltas[1]
    var crateMoved = null

    if (this.isCrate(this.player.posX+dX, this.player.posY+dY)) {
        crateMoved = this.moveCrate(this.player.posX+dX, this.player.posY+dY, dX, dY)
        if (crateMoved === false) {
            return false
        }
    }

    if (!this.isClear(this.player.posX+dX, this.player.posY+dY)) {
        return false
    }

    this.moves++
    this.updateScore()

    this.player.isMoving = true
    var playerTween = this.game.add.tween(this.player)

    playerTween.to({
        x: this.player.x + dX * TILES,
        y: this.player.y + dY * TILES
    }, 100, Phaser.Easing.Linear.None, true)

    this.map[this.player.posY][this.player.posX] -= PLAYER
    this.player.posX += dX
    this.player.posY += dY
    this.map[this.player.posY][this.player.posX] += PLAYER

    playerTween.onComplete.add(function() {
        this.player.frame = this.map[this.player.posY][this.player.posX]
        this.player.isMoving = false
    }.bind(this))

    if (logMove) {
        this.undoStack.push({dX:-dX, dY:-dY, crate: crateMoved})
    }

}


App.play.prototype.moveCrate = function(sX, sY, dX, dY) {
    if (this.crates[sY][sX].isMoving || !this.isClear(sX+dX, sY+dY)) {
        return false
    }

    this.crates[sY][sX].isMoving = true

    var crateTween = this.game.add.tween(this.crates[sY][sX])
    crateTween.to({
        x: (sX+dX)*TILES,
        y: (sY+dY)*TILES
    }, 100, Phaser.Easing.Linear.None, true)

    if (this.map[sY][sX] === SPOT+CRATE) {
        this.filledSpots--
    }

    if (this.map[sY+dY][sX+dX] === SPOT
     || this.map[sY+dY][sX+dX] === SPOT+PLAYER) {
         this.filledSpots++
    }

    this.map[sY][sX] -= CRATE
    this.map[sY+dY][sX+dX] += CRATE

    this.crates[sY+dY][sX+dX] = this.crates[sY][sX]
    this.crates[sY][sX] = null

    crateTween.onComplete.add(function() {
        this.crates[sY+dY][sX+dX].frame = this.map[sY+dY][sX+dX]
        this.crates[sY+dY][sX+dX].isMoving = false
    }.bind(this))

    return {x: sX+dX, y: sY+dY, dX: -dX, dY: -dY}

}

App.play.prototype.updateScore = function() {
    this.scoreText.text = "Moves: " + this.moves
}

App.play.prototype.undoMove = function() {
    if (this.undoStack.length === 0 || this.player.isMoving) {
        return
    }

    var move = this.undoStack.pop()
    this.movePlayer([move.dX, move.dY], false)
    if (move.crate) {
        this.moveCrate(move.crate.x, move.crate.y, move.crate.dX, move.crate.dY)
    }
}