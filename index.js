(() => {

    const Game = new Phaser.Game(320, 320, Phaser.AUTO, "", {preload: preload, create: create})

    const EMPTY = 0
    const WALL = 1
    const SPOT = 2
    const CRATE = 3
    const PLAYER = 4

    const UP = [0, -1]
    const DOWN = [0, 1]
    const LEFT = [-1, 0]
    const RIGHT = [1, 0]

    const TILES = 40

    const Levels = [
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

    let level = 0

    let crates = []

    let player

    let startX
    let startY
    let endX
    let endY

    let fixedGroup
    let moveableGroup

    let moves = 0
    let crateCount = 0
    let cratesOnSpots = 0

    let keys = {
        "up": {
            key: Phaser.KeyCode.UP,
            action: () => { movePlayer(UP) }
        },
        "down": {
            key: Phaser.KeyCode.DOWN,
            action: () => { movePlayer(DOWN) }
        },
        "left": {
            key: Phaser.KeyCode.LEFT,
            action: () => { movePlayer(LEFT) }
        },
        "right": {
            key: Phaser.KeyCode.RIGHT,
            action: () => { movePlayer(RIGHT) }
        },
        "undo": {
            key: Phaser.KeyCode.U,
            action: () => { undoMove() }
        }
    }

    let keymap = {}

    let undoStack = []

    function preload() {
        Game.load.spritesheet("tiles", "tiles.png", TILES, TILES)
    }

    function create() {

        Game.scale.pageAlignHorizontally = true
        Game.scale.pageAlignVertically = true

        Game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL

        Game.scale.refresh(true)

        drawLevel(0)

        Game.input.onDown.add(startSwipe, this)
        rebuildKeymap()
        Game.input.keyboard.addCallbacks(this,keyDown)
    }

    function clearLevel() {
        undoStack.length = 0
        crates = []
        crateCount = 0
        cratesOnSpots = 0
        moveableGroup.destroy()
        fixedGroup.destroy()
    }

    function drawLevel(levelNum) {
        levelNum = levelNum || level
        level = levelNum

        clearLevel()

        fixedGroup = Game.add.group()
        moveableGroup = Game.add.group()

        for (let y = 0; y < Levels[level].length; y++) {
            crates[y] = []
            for (let x = 0; x < Levels[level][y].length; x++) {
                crates[y][x] = null
                let currentTile = Levels[level][y][x]
                let tileX = x * TILES
                let tileY = y * TILES

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

    function startSwipe() {
        startX = Game.input.worldX
        startY = Game.input.worldY
        Game.input.onDown.remove(startSwipe)
        Game.input.onUp.add(endSwipe)
    }

    function endSwipe() {
        endX = Game.input.worldX
        endY = Game.input.worldY

        let distX = endX-startX
        let distY = endY-startY

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
        for (let k in keys) {
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
        let dX = deltas[0]
        let dY = deltas[1]
        let crateMoved = null
        if (isCrate(player.posX+dX,player.posY+dY)) {
            crateMoved = moveCrate(player.posX+dX, player.posY+dY, dX,dY)
            if (crateMoved === false) {
                return false
            }
        }
        if (!isClear(player.posX+dX,player.posY+dY) || player.isMoving) {
            return false
        }

        player.isMoving = true
        let playerTween = Game.add.tween(player)
        
        playerTween.to({
            x: player.x + dX * TILES,
            y: player.y + dY * TILES
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

        let crateTween = Game.add.tween(crates[sY][sX])
        crateTween.to({
            x: (sX+dX)*TILES,
            y: (sY+dY)*TILES
        }, 100, Phaser.Easing.Linear.None, true)

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

        let move = undoStack.pop()
        movePlayer([move.dX, move.dY], false)
        if (move.crate) {
            moveCrate(move.crate.x, move.crate.y, move.crate.dX, move.crate.dY)
        }
    }

})()