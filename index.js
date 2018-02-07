(function() {

    var Game = new Phaser.Game({
        width: "100%",
        height: "100%",
        renderer: Phaser.AUTO,
        antialias: false,
        state: {
            preload: preload,
            create: create,
            resize: resize,
            render: render
        }
    })

    var EMPTY = 0
    var WALL = 1
    var SPOT = 2
    var CRATE = 3
    var PLAYER = 4

    var UP = [0, -1]
    var DOWN = [0, 1]
    var LEFT = [-1, 0]
    var RIGHT = [1, 0]


    var Levels = [
        [
            [WALL,WALL,WALL,WALL,WALL,WALL,WALL,WALL],
            [WALL,EMPTY,EMPTY,WALL,WALL,WALL,WALL,WALL],
            [WALL,EMPTY,EMPTY,WALL,WALL,WALL,WALL,WALL],
            [WALL,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,EMPTY,WALL],
            [WALL,WALL,EMPTY,SPOT,WALL,CRATE,EMPTY,WALL],
            [WALL,EMPTY,EMPTY,PLAYER,WALL,EMPTY,EMPTY,WALL],
            [WALL,EMPTY,EMPTY,EMPTY,WALL,WALL,WALL,WALL],
            [WALL,WALL,WALL,WALL,WALL,WALL,WALL,WALL]
        ]
    ]

    var level = 0

    var crates = []

    var player

    var tileSize = 40
    var gameScale = 1

    var startX
    var startY
    var endX
    var endY

    var fixedGroup
    var moveableGroup

    var levelText
    var scoreText

    var moves = 0
    var crateCount = 0
    var cratesOnSpots = 0

    var keys = {
        "up": {
            key: Phaser.KeyCode.UP,
            action: function() { movePlayer(UP) }
        },
        "down": {
            key: Phaser.KeyCode.DOWN,
            action: function() { movePlayer(DOWN) }
        },
        "left": {
            key: Phaser.KeyCode.LEFT,
            action: function() { movePlayer(LEFT) }
        },
        "right": {
            key: Phaser.KeyCode.RIGHT,
            action: function() { movePlayer(RIGHT) }
        },
        "undo": {
            key: Phaser.KeyCode.U,
            action: function() { undoMove() }
        }
    }

    var keymap = {}

    var undoStack = []

    function preload() {
        Game.load.spritesheet("tiles", "tiles.png", tileSize, tileSize)
    }

    function create() {

        Game.time.advancedTiming = true

        Game.stage.backgroundColor = "#555555"
        Game.scale.pageAlignHorizontally = true
        Game.scale.pageAlignVertically = true

        Game.scale.scaleMode = Phaser.ScaleManager.RESIZE

        Game.scale.refresh(true)

        drawLevel(0)
        drawOverlay()

        Game.input.onDown.add(startSwipe, this)
        rebuildKeymap()
        Game.input.keyboard.addCallbacks(this,keyDown)

        resize()
    }

    function resize() {
        gameScale = Game.width < Game.height
            ? Game.width/320
            : Game.height/320
        var playMin = Game.width < Game.height ? Game.width : Game.height
        fixedGroup.scale.setTo(gameScale, gameScale)
        fixedGroup.x = Math.round((Game.width-playMin)/2)
        fixedGroup.y = Math.round((Game.height-playMin)/2)
        moveableGroup.scale.setTo(gameScale, gameScale)
        moveableGroup.x = Math.round((Game.width-playMin)/2)
        moveableGroup.y = Math.round((Game.height-playMin)/2)
        levelText.x = Math.round((Game.width/2))
        levelText.fontSize = 24*gameScale
        scoreText.x = Math.round((Game.width/2))
        scoreText.y = Game.height
        scoreText.fontSize = 24*gameScale
    }

    function render() {
        if (location.hash === "#debug") {
            Game.debug.text(Game.time.fps, 2, 14, "#00ff00");
        }
    }

    function clearLevel() {
        undoStack.length = 0
        crates.length = 0
        crateCount = 0
        cratesOnSpots = 0
        if (moveableGroup && moveableGroup.destroy) {
            moveableGroup.destroy()
            fixedGroup.destroy()
        }
    }

    function drawLevel(levelNum) {
        levelNum = levelNum || level
        level = levelNum

        clearLevel()

        fixedGroup = Game.add.group()
        moveableGroup = Game.add.group()

        for (var y = 0; y < Levels[level].length; y++) {
            crates[y] = []
            for (var x = 0; x < Levels[level][y].length; x++) {
                crates[y][x] = null
                var currentTile = Levels[level][y][x]
                var tileX = x * tileSize
                var tileY = y * tileSize

                if ( currentTile === SPOT
                  || currentTile === SPOT+PLAYER
                  || currentTile === SPOT+CRATE
                  || currentTile === WALL) {
                    Game.add.sprite(tileX, tileY, "tiles", currentTile === WALL ? WALL : SPOT, fixedGroup)
                } else 
                
                if (currentTile === CRATE || currentTile === SPOT+CRATE) {
                    crates[y][x] = Game.add.sprite(tileX, tileY, "tiles", currentTile, moveableGroup)
                    crates[y][x].isMoving = false
                    crateCount++
                }

                if (currentTile === PLAYER || currentTile === SPOT+PLAYER) {
                    player = Game.add.sprite(tileX, tileY, "tiles", currentTile, moveableGroup)
                    player.posX = x
                    player.posY = y
                    player.isMoving = false
                }

                if (currentTile === EMPTY || currentTile === CRATE || currentTile === PLAYER) {
                    Game.add.sprite(tileX, tileY, "tiles", EMPTY, fixedGroup)
                }

            }
        }
    }

    function drawOverlay() {
        if (levelText) {
            levelText.destroy()
        }
        levelText = Game.add.text(
            Game.width/2,
            0,
            "Level " + (level+1),
            {
                font: "bold 24px Helvetica",
                fill: "#ffffff"
            }
        )
        levelText.anchor.x = 0.5

        if (scoreText) {
            scoreText.destroy()
        }
        scoreText = Game.add.text(
            Game.width/2,
            Game.height,
            "Moves: " + moves,
            {
                font: "bold 24px Helvetica",
                fill: "#ffffff"
            }
        )
        scoreText.anchor.x = 0.5
        scoreText.anchor.y = 1
    }

    function updateScore() {
        scoreText.text = "Moves: " + moves
    }

    function updateLevel() {
        levelText.text = "Level " + (level+1)
    }

    function startSwipe() {
        startX = Game.input.worldX
        startY = Game.input.worldY
        Game.input.onDown.remove(startSwipe)
        Game.input.onUp.add(endSwipe)
    }

    function endSwipe() {
        endX = Game.input.worldX
        endY = Game.input.worldY

        var distX = endX-startX
        var distY = endY-startY

        if (distY < 0 && distY < -(Math.abs(distX)*2)) {
            movePlayer(UP)
        } else if (distY > 0 && distY > Math.abs(distX)*2) {
            movePlayer(DOWN)
        } else if (distX < 0 && distX < -(Math.abs(distY)*2)) {
            movePlayer(LEFT)
        } else if (distX > 0 && distX > Math.abs(distY)*2) {
            movePlayer(RIGHT)
        }

        Game.input.onUp.remove(endSwipe)
        Game.input.onDown.add(startSwipe)
    }

    function rebuildKeymap() {

        keymap = {}
        for (var k in keys) {
            if (!keys.hasOwnProperty(k)) {
                continue
            }

            keymap[keys[k].key] = keys[k].action
        }

    }

    function keyDown(e) {

        if (!keymap.hasOwnProperty(e.keyCode)) {
            return
        }

        keymap[e.keyCode]()

    }

    function isClear(x, y) {
        return Levels[level][y][x] === EMPTY || Levels[level][y][x] === SPOT
    }
    
    function isCrate(x, y) {
        return Levels[level][y][x] === CRATE || Levels[level][y][x] === CRATE+SPOT
    }

    function movePlayer(deltas, logMove) {
        logMove = logMove === false ? false : true
        var dX = deltas[0]
        var dY = deltas[1]
        var crateMoved = null
        if (isCrate(player.posX+dX,player.posY+dY)) {
            crateMoved = moveCrate(player.posX+dX, player.posY+dY, dX,dY)
            if (crateMoved === false) {
                return false
            }
        }
        if (!isClear(player.posX+dX,player.posY+dY) || player.isMoving) {
            return false
        }

        moves++
        updateScore()

        player.isMoving = true
        var playerTween = Game.add.tween(player)
        
        playerTween.to({
            x: player.x + dX * tileSize,
            y: player.y + dY * tileSize
        }, 100, Phaser.Easing.Linear.None, true)

        Levels[level][player.posY][player.posX] -= PLAYER
        player.posX += dX
        player.posY += dY
        Levels[level][player.posY][player.posX] += PLAYER
        
        playerTween.onComplete.add(function() {
            player.frame = Levels[level][player.posY][player.posX]
            player.isMoving = false
        })

        if (logMove) {
            undoStack.push({dX:-dX, dY:-dY, crate: crateMoved})
        }
        
    }

    function moveCrate(sX, sY, dX, dY) {
        if (!isClear(sX+dX,sY+dY) || crates[sY][sX].isMoving) {
            return false
        }

        crates[sY][sX].isMoving = true

        var crateTween = Game.add.tween(crates[sY][sX])
        crateTween.to({
            x: (sX+dX)*tileSize,
            y: (sY+dY)*tileSize
        }, 100, Phaser.Easing.Linear.None, true)

        if (Levels[level][sY][sX] === SPOT+CRATE) {
            cratesOnSpots--
        }

        if (Levels[level][sY+dY][sX+dX] === SPOT
         || Levels[level][sY+dY][sX+dX] === SPOT+PLAYER) {
            cratesOnSpots++
        }
        
        Levels[level][sY][sX] -= CRATE
        Levels[level][sY+dY][sX+dX] += CRATE

        crates[sY+dY][sX+dX] = crates[sY][sX]
        crates[sY][sX] = null

        crateTween.onComplete.add(function() {
            crates[sY+dY][sX+dX].frame = Levels[level][sY+dY][sX+dX]
            crates[sY+dY][sX+dX].isMoving = false
        })
        return {x: sX+dX, y: sY+dY, dX: -dX, dY: -dY}
    }

    function undoMove() {
        if (undoStack.length === 0 || player.isMoving) {
            return
        }

        var move = undoStack.pop()
        movePlayer([move.dX, move.dY], false)
        if (move.crate) {
            moveCrate(move.crate.x, move.crate.y, move.crate.dX, move.crate.dY)
        }
    }

})()