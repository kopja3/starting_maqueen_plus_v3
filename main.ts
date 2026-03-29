function turnLeft() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_SLOW)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
}
function stopMotors() {
    maqueenPlusV2.controlMotorStop(maqueenPlusV2.MyEnumMotor.AllMotor)
}
function driveBackward() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Backward, BACK_SPEED)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Backward, BACK_SPEED)
}
function turnRight() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_FAST)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, TURN_SLOW)
}
function driveForward() {
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.LeftMotor, maqueenPlusV2.MyEnumDir.Forward, FORWARD_SPEED)
    maqueenPlusV2.controlMotor(maqueenPlusV2.MyEnumMotor.RightMotor, maqueenPlusV2.MyEnumDir.Forward, FORWARD_SPEED)
}
function isObstacle(dist: number) {
    return dist > 0 && dist < OBSTACLE_MM
}
function openScore(dist: number) {
    if (dist <= 0) {
        return 1000
    } else {
        return dist
    }
}
function escapeFromStuck() {
    stopMotors()
    basic.pause(150)

    // noin 15 cm, säädä tarvittaessa 500...800 ms
    driveBackward()
    basic.pause(BACK_15CM_MS)

    // käänny siihen suuntaan, jossa on enemmän tilaa
    if (openScore(leftDist) > openScore(rightDist)) {
        turnLeft()
    } else {
        turnRight()
    }
    basic.pause(RETRY_TURN_MS)

    stopMotors()
    basic.pause(100)

    stuckStart = 0
    prevLeftDist = leftDist
    prevRightDist = rightDist
}

let rightDist = 0
let leftDist = 0
let BACK_SPEED = 0
let TURN_SLOW = 0
let TURN_FAST = 0
let FORWARD_SPEED = 0
let OBSTACLE_MM = 0

let prevLeftDist = 0
let prevRightDist = 0
let stuckStart = 0
let STUCK_TIME_MS = 0
let STUCK_DELTA_MM = 0
let WATCH_NEAR_MM = 0
let BACK_15CM_MS = 0
let RETRY_TURN_MS = 0

FORWARD_SPEED = 75
TURN_FAST = 80
TURN_SLOW = 25
BACK_SPEED = 55
OBSTACLE_MM = 200

// jumitunnistuksen säädöt
STUCK_TIME_MS = 3000
STUCK_DELTA_MM = 15
WATCH_NEAR_MM = 300
BACK_15CM_MS = 650
RETRY_TURN_MS = 450

maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(matrixLidarDistance.Addr.Addr4, matrixLidarDistance.Matrix.OBS)
matrixLidarDistance.setObstacleDistance(OBSTACLE_MM)

basic.forever(function () {
    matrixLidarDistance.getData()
    leftDist = matrixLidarDistance.getObstacleDistance(matrixLidarDistance.ObstacleSide.Left)
    rightDist = matrixLidarDistance.getObstacleDistance(matrixLidarDistance.ObstacleSide.Right)

    // normaali esteenväistö
    if (isObstacle(leftDist) || isObstacle(rightDist)) {
        stopMotors()
        basic.pause(150)
        driveBackward()
        basic.pause(300)

        if (openScore(leftDist) > openScore(rightDist)) {
            turnLeft()
        } else {
            turnRight()
        }

        basic.pause(320)

        stuckStart = 0
        prevLeftDist = leftDist
        prevRightDist = rightDist

    } else {
        // vapaa reitti -> aja eteenpäin
        driveForward()

        // yritetään tunnistaa jumi vain silloin, kun ainakin jompikumpi etäisyys on lähellä
        if ((leftDist > 0 && leftDist < WATCH_NEAR_MM) || (rightDist > 0 && rightDist < WATCH_NEAR_MM)) {

            if (prevLeftDist == 0 && prevRightDist == 0) {
                prevLeftDist = leftDist
                prevRightDist = rightDist
                stuckStart = input.runningTime()
            } else {
                if (Math.abs(leftDist - prevLeftDist) <= STUCK_DELTA_MM &&
                    Math.abs(rightDist - prevRightDist) <= STUCK_DELTA_MM) {

                    if (stuckStart == 0) {
                        stuckStart = input.runningTime()
                    }

                    if (input.runningTime() - stuckStart >= STUCK_TIME_MS) {
                        escapeFromStuck()
                    }
                } else {
                    // etäisyydet muuttuivat -> auto todennäköisesti liikkuu
                    prevLeftDist = leftDist
                    prevRightDist = rightDist
                    stuckStart = input.runningTime()
                }
            }
        } else {
            // ei tarpeeksi tietoa jumitunnistukseen
            stuckStart = 0
            prevLeftDist = leftDist
            prevRightDist = rightDist
        }
    }

    basic.pause(50)
})