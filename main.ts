let OBSTACLE_MM = 0
let TRAP_MM = 0
let FORWARD_SPEED = 0
let TURN_FAST = 0
let TURN_SLOW = 0
let BACK_SPEED = 0
let ESCAPE_BACK_SPEED = 0
let leftDist = 0
let rightDist = 0
let escapeSide = 0
let escapeLevel = 0
let backTime = 0
let turnTime = 0

function stopMotors() {
    maqueenPlusV2.controlMotorStop(maqueenPlusV2.MyEnumMotor.AllMotor)
}

function driveForward() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, FORWARD_SPEED)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, FORWARD_SPEED)
}

function driveBackward() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Backward, BACK_SPEED)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Backward, BACK_SPEED)
}

function driveBackwardHard() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Backward, ESCAPE_BACK_SPEED)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Backward, ESCAPE_BACK_SPEED)
}

function turnLeftSoft() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_SLOW)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
}

function turnRightSoft() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_SLOW)
}

function spinLeft() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Backward, TURN_FAST)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
}

function spinRight() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Backward, TURN_FAST)
}

// Säädöt
OBSTACLE_MM = 220
TRAP_MM = 170

FORWARD_SPEED = 60
TURN_FAST = 75
TURN_SLOW = 20
BACK_SPEED = 50
ESCAPE_BACK_SPEED = 65

escapeSide = 0
escapeLevel = 0

maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(matrixLidarDistance.Addr.Addr4, matrixLidarDistance.Matrix.OBS)
matrixLidarDistance.setObstacleDistance(OBSTACLE_MM)

basic.forever(function () {
    matrixLidarDistance.getData()
    leftDist = matrixLidarDistance.getObstacleDistance(matrixLidarDistance.ObstacleSide.Left)
    rightDist = matrixLidarDistance.getObstacleDistance(matrixLidarDistance.ObstacleSide.Right)

    // Ahdas väli: molemmat puolet liian lähellä
    if (leftDist < TRAP_MM && rightDist < TRAP_MM) {
        escapeLevel += 1
        if (escapeLevel > 3) {
            escapeLevel = 3
        }

        backTime = 500 + escapeLevel * 200
        turnTime = 600 + escapeLevel * 200

        stopMotors()
        basic.pause(100)
        driveBackwardHard()
        basic.pause(backTime)

        // Käänny sinne, missä on enemmän tilaa
        if (leftDist + 30 < rightDist) {
            spinRight()
            escapeSide = 1
        } else if (rightDist + 30 < leftDist) {
            spinLeft()
            escapeSide = 0
        } else {
            // Jos molemmat ovat melkein yhtä lähellä, vaihda suuntaa vuorotellen
            if (escapeSide == 0) {
                spinLeft()
                escapeSide = 1
            } else {
                spinRight()
                escapeSide = 0
            }
        }

        basic.pause(turnTime)
        stopMotors()
        basic.pause(100)

        // Edessä jotain molemmilla puolilla, mutta ei vielä aivan jumissa
    } else if (leftDist < OBSTACLE_MM && rightDist < OBSTACLE_MM) {
        stopMotors()
        basic.pause(50)
        driveBackwardHard()
        basic.pause(400)

        if (escapeSide == 0) {
            spinLeft()
            escapeSide = 1
        } else {
            spinRight()
            escapeSide = 0
        }

        basic.pause(500)
        stopMotors()
        basic.pause(50)

        // Vasen puoli liian lähellä -> väistä oikealle
    } else if (leftDist < OBSTACLE_MM) {
        turnRightSoft()
        basic.pause(180)

        // Oikea puoli liian lähellä -> väistä vasemmalle
    } else if (rightDist < OBSTACLE_MM) {
        turnLeftSoft()
        basic.pause(180)

        // Reitti vapaa
    } else {
        driveForward()
        escapeLevel = 0
    }
})