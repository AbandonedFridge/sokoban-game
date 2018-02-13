App.menu = function(game) {}

App.menu.prototype.create = function() {

    console.log(
        "%c %c %c Tap/Click to Start!                             %c %c ",
        "background: #ffb740;",
        "background: #ff9620;",
        "color: #fff; background: #ee7600;",
        "background: #ff8720;",
        "background: #ffb740;"
    )

    this.titleText = this.add.text(
        this.game.width/2,
        100,
        "My\nAwesome\nSokoban\nKnockoff",
        {
            font: "bold 32px Helvetica",
            fill: "#fea740",
            align: "center"
        }
    )
    this.startText = this.add.text(
        this.game.width/2,
        this.game.height-100,
        "Tap to Start",
        {
            font: "bold 24px Helvetica",
            fill: "#ee6700"
        }
    )

    this.titleText.anchor.setTo(0.5,0)
    this.startText.anchor.setTo(0.5,1)

    this.input.onDown.add(this.tappyTap, this)

    this.resize()
}

App.menu.prototype.tappyTap = function() {

    this.input.onDown.remove(this.tappyTap)
    this.game.state.start("play")

}

App.menu.prototype.resize = function() {
    App.gameScale = this.game.width < this.game.height
        ? this.game.width/(8*TILES)
        : this.game.height/(8*TILES)
    this.titleText.x =
    this.startText.x = Math.round(this.game.width/2)
    this.titleText.fontSize = 32*App.gameScale
    this.startText.fontSize = 24*App.gameScale
}

if (App.debug) { App.menu.prototype.render = function () {
    
    this.game.debug.text(this.game.time.fps, 2, this.game.height - 14, "#00ff00");

}}