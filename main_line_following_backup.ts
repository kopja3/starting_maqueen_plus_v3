let followingLine = false
let lastTurn = 0

const BASE_SPEED = 70
const TURN_FAST = 110
const TURN_SLOW = 20

function stopCar() {
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.LeftMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        0
    )
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.RightMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        0
    )
}

function goStraight() {
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.LeftMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        BASE_SPEED
    )
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.RightMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        BASE_SPEED
    )
}

function turnLeftSoft() {
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.LeftMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        TURN_SLOW
    )
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.RightMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        TURN_FAST
    )
    lastTurn = -1
}

function turnRightSoft() {
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.LeftMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        TURN_FAST
    )
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.RightMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        TURN_SLOW
    )
    lastTurn = 1
}

input.onButtonPressed(Button.B, function () {
    followingLine = true
    basic.showString("GO")
})

input.onButtonPressed(Button.A, function () {
    followingLine = false
    stopCar()
    basic.showString("STOP")
})

maqueenPlusV2.I2CInit()
basic.showString("VALMIS")

basic.forever(function () {
    if (!followingLine) {
        basic.pause(50)
        return
    }

    let left = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorL1)
    let middle = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorM)
    let right = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorR1)

    // musta viiva = 1, vaalea = 0
    if (middle == 1 && left == 0 && right == 0) {
        goStraight()
    } else if (left == 1 && right == 0) {
        turnLeftSoft()
    } else if (right == 1 && left == 0) {
        turnRightSoft()
    } else if (left == 1 && middle == 1 && right == 0) {
        turnLeftSoft()
    } else if (right == 1 && middle == 1 && left == 0) {
        turnRightSoft()
    } else if (left == 1 && middle == 1 && right == 1) {
        goStraight()
    } else {
        if (lastTurn < 0) {
            turnLeftSoft()
        } else if (lastTurn > 0) {
            turnRightSoft()
        } else {
            stopCar()
        }
    }

    basic.pause(10)
})