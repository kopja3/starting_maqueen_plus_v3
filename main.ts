enum ProgramMode {
    LineFollowing,
    LaserShuttle,
}

// Change this one line in MakeCode to choose the program.
const ACTIVE_MODE = ProgramMode.LineFollowing

let robotRunning = false

function showSelectedMode() {
    if (ACTIVE_MODE == ProgramMode.LineFollowing) {
        basic.showString("LINE")
    } else {
        basic.showString("LASER")
    }
}

input.onButtonPressed(Button.B, function () {
    robotRunning = true
    basic.showString("GO")
})

input.onButtonPressed(Button.A, function () {
    robotRunning = false
    Drive.stop()
    basic.showString("STOP")
})

input.onButtonPressed(Button.AB, function () {
    if (ACTIVE_MODE == ProgramMode.LaserShuttle) {
        LaserShuttleMode.toggleReverseMode()
    } else {
        showSelectedMode()
    }
})

maqueenPlusV2.I2CInit()

if (ACTIVE_MODE == ProgramMode.LaserShuttle) {
    LaserShuttleMode.init()
} else {
    LineFollowingMode.init()
}

showSelectedMode()

basic.forever(function () {
    if (!robotRunning) {
        basic.pause(50)
        return
    }

    if (ACTIVE_MODE == ProgramMode.LineFollowing) {
        LineFollowingMode.step()
    } else {
        LaserShuttleMode.step()
    }

    basic.pause(10)
})