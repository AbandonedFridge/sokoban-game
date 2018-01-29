(() => {

    var Game = new Phaser.Game(320, 320, Phaser.AUTO, "", {preload: preload, create: create})

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

    var level = 0

    var crates = []

    var player

    var startX
    var startY
    var endX
    var endY

    function preload() {
        Game.load.spritesheet("tiles", "tiles.png", TILES, TILES)
    }

    function create() {

        Game.scale.pageAlignHorizontally = true
        Game.scale.pageAlignVertically = true

        Game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL

        Game.scale.refresh(true)

        var fixedGroup = Game.add.group()
        var moveableGroup = Game.add.group()
        var tile

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
                    tile = Game.add.sprite(tileX, tileY, "tiles", currentTile === WALL ? WALL : SPOT, fixedGroup)
                } else 
                
                if (currentTile === CRATE || currentTile === SPOT+CRATE) {
                    crates[y][x] = Game.add.sprite(tileX, tileY, "tiles", currentTile, moveableGroup)
                }

                if (currentTile === PLAYER || currentTile === SPOT+PLAYER) {
                    player = Game.add.sprite(tileX, tileY, "tiles", currentTile, moveableGroup)
                    player.posX = x
                    player.posY = y
                }

                if (currentTile === EMPTY || currentTile === CRATE || currentTile === PLAYER) {
                    tile = Game.add.sprite(tileX, tileY, "tiles", EMPTY, fixedGroup)
                }

            }
        }

        Game.input.onDown.add(startSwipe, this)
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

        let distX = startX-endX
        let distY = startY-endY

        if (distY > 0 && distY > Math.abs(distX)*2) {
            movePlayer(UP)
        } else if (distY < 0 && distY < -(Math.abs(distX)*2)) {
            movePlayer(DOWN)
        } else if (distX > 0 && distX > Math.abs(distY)*2) {
            movePlayer(LEFT)
        } else if (distX < 0 && distX < -(Math.abs(distY)*2)) {
            movePlayer(RIGHT)
        }

        Game.input.onUp.remove(endSwipe)
        Game.input.onDown.add(startSwipe)
    }

    function isClear(x, y) {
        return Levels[level][y][x] === EMPTY || Levels[level][y][x] === SPOT
    }
    
    function isCrate(x, y) {
        return Levels[level][y][x] === CRATE || Levels[level][y][x] === CRATE+SPOT
    }

    function movePlayer(deltas) {
        let dX = deltas[0]
        let dY = deltas[1]
        if (isCrate(player.posX+dX,player.posY+dY)) {
            let crateMoved = moveCrate(player.posX+dX, player.posY+dY, dX,dY)
            if (crateMoved === false) {
                return false
            }
        }
        if (!isClear(player.posX+dX,player.posY+dY)) {
            return false
        }

        var playerTween = Game.add.tween(player)
        
        playerTween.to({
            x: player.x + dX * TILES,
            y: player.y + dY * TILES
        }, 100, Phaser.Easing.Linear.None, true)

        Levels[level][player.posY][player.posX] -= PLAYER
        player.posX += dX
        player.posY += dY
        Levels[level][player.posY][player.posX] += PLAYER
        
        player.frame = Levels[level][player.posY][player.posX]
        
    }

    function moveCrate(sX, sY, dX, dY) {
        if (!isClear(sX+dX,sY+dY)) {
            return false
        }

        var crateTween = Game.add.tween(crates[sY][sX])
        crateTween.to({
            x: (sX+dX)*TILES,
            y: (sY+dY)*TILES
        }, 100, Phaser.Easing.Linear.None, true)

        Levels[level][sY][sX] -= CRATE
        Levels[level][sY+dY][sX+dX] += CRATE

        crates[sY+dY][sX+dX] = crates[sY][sX]
        crates[sY][sX].frame = Levels[level][sY+dY][sX+dX]
        crates[sY][sX] = null

    }

})()