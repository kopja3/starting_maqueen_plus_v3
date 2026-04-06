// Maqueen Plus V3 laser shuttle example
// Requires MakeCode extension:
// matrixLidarDistance = github:DFRobot/pxt-DFRobot_matrixLidarDistanceSensor

let followingLine = false
let reverseMode = false
let lastTurn = 0

const BASE_SPEED = 70
const TURN_FAST = 110
const TURN_SLOW = 20
const TURN_AROUND_MS = 560
const LASER_THRESHOLD_MM = 380
const LASER_X = 4
const LASER_Y = 6

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

function turnAround() {
    stopCar()
    basic.pause(80)

    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.LeftMotor,
        maqueenPlusV2.MyEnumDir.Forward,
        TURN_FAST
    )
    maqueenPlusV2.controlMotor(
        maqueenPlusV2.MyEnumMotor.RightMotor,
        maqueenPlusV2.MyEnumDir.Backward,
        TURN_FAST
    )

    basic.pause(TURN_AROUND_MS)
    stopCar()
    basic.pause(120)
    reverseMode = !reverseMode
}

function obstacleAhead(): boolean {
    let centerMm = matrixLidarDistance.matrixPointOutput(LASER_X, LASER_Y)
    return centerMm > 0 && centerMm < LASER_THRESHOLD_MM
}

function followLineForward() {
    let left = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorL1)
    let middle = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorM)
    let right = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorR1)

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
}

function followLineBackward() {
    let left = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorL1)
    let middle = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorM)
    let right = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorR1)

    if (middle == 1 && left == 0 && right == 0) {
        goStraight()
    } else if (left == 1 && right == 0) {
        turnRightSoft()
    } else if (right == 1 && left == 0) {
        turnLeftSoft()
    } else if (left == 1 && middle == 1 && right == 0) {
        turnRightSoft()
    } else if (right == 1 && middle == 1 && left == 0) {
        turnLeftSoft()
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

input.onButtonPressed(Button.AB, function () {
    reverseMode = !reverseMode
    stopCar()
    if (reverseMode) {
        basic.showString("REV")
    } else {
        basic.showString("FWD")
    }
})

maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(
    matrixLidarDistance.Addr.Addr4,
    matrixLidarDistance.Matrix.X8
)

basic.showString("LIDAR")
basic.pause(3500)
basic.showString("VALMIS")

basic.forever(function () {
    if (!followingLine) {
        basic.pause(50)
        return
    }

    if (obstacleAhead()) {
        turnAround()
        return
    }

    if (reverseMode) {
        followLineBackward()
    } else {
        followLineForward()
    }

    basic.pause(10)
})