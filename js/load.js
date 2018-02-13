App.load = function (game) {}

App.load.prototype.preload = function () {

    console.log(
        "%c %c %c Loading...                                      %c %c ",
        "background: #ffb740;",
        "background: #ff9620;",
        "color: #fff; background: #ee7600;",
        "background: #ff8720;",
        "background: #ffb740;"
    )

    this.loadText = this.add.text(
        this.game.width/2,
        this.game.height/2,
        'loading...',
        {
            font: "bold 24px Helvetica",
            fill: "#ee6700"
        }
    )

    this.loadText.anchor.setTo(0.5, 0.5)

    this.game.load.spritesheet("tiles", "tiles.png", TILES, TILES)
    this.game.load.json("levels", "js/levels.json")

}

App.load.prototype.create = function () {

    this.game.state.start("menu")

}

if (App.debug) { App.load.prototype.render = function () {
    
    this.game.debug.text(this.game.time.fps, 2, this.game.height - 14, "#00ff00");

}}