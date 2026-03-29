let leftFront = 0
let centerFront = 0
let rightFront = 0
let leftSpeed = 0
let rightSpeed = 0
let pidForwardActive = false
let forwardStartedAt = 0
let stuckSince = 0
let almostStoppedSince = 0
let turnBias = 1

let lastAnnounceTime = 0
let ANNOUNCE_COOLDOWN_MS = 1500

const LIDAR_ADDR = matrixLidarDistance.Addr.Addr4
const RIGHT_SIGN = 1

const SIDE_OBSTACLE_MM = 260
const CENTER_OBSTACLE_MM = 220
const FORWARD_SEGMENT_CM = 120
const BACKUP_CM = 15
const NORMAL_TURN_DEG = 95
const ESCAPE_TURN_DEG = 130
const STUCK_SPEED_CM_S = 2
const STUCK_TIME_MS = 3000
const FINISHED_SPEED_CM_S = 1
const FINISHED_TIME_MS = 400

function avgSpeed() {
    return (Math.abs(leftSpeed) + Math.abs(rightSpeed)) / 2
}

function isObstacle(dist: number, threshold: number) {
    return dist > 0 && dist < threshold
}

function spaceScore(dist: number) {
    if (dist > 0) {
        return dist
    } else {
        return 9999
    }
}

function readFrontDistances() {
    leftFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 0, 6)
    centerFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 3, 6)
    rightFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 7, 6)
}

function stopPidNow() {
    maqueenPlusV2.pidControlStop()
    pidForwardActive = false
    stuckSince = 0
    almostStoppedSince = 0
}

function startForwardPid() {
    maqueenPlusV2.pidControlDistance(
        maqueenPlusV2.SpeedDirection.SpeedCW,
        FORWARD_SEGMENT_CM,
        maqueenPlusV2.MyInterruption.Allowed
    )
    pidForwardActive = true
    forwardStartedAt = input.runningTime()
    stuckSince = 0
    almostStoppedSince = 0
}

function turnRightDeg(deg: number) {
    maqueenPlusV2.pidControlAngle(
        RIGHT_SIGN * deg,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
}

function turnLeftDeg(deg: number) {
    maqueenPlusV2.pidControlAngle(
        -RIGHT_SIGN * deg,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
}

function canAnnounce() {
    return input.runningTime() - lastAnnounceTime > ANNOUNCE_COOLDOWN_MS
}

function announceObstacleLeft() {
    if (canAnnounce()) {
        lastAnnounceTime = input.runningTime()
        basic.showString("ESTE VAS")
        music.playTone(262, music.beat(BeatFraction.Half))
    }
}

function announceObstacleRight() {
    if (canAnnounce()) {
        lastAnnounceTime = input.runningTime()
        basic.showString("ESTE OIK")
        music.playTone(262, music.beat(BeatFraction.Half))
    }
}

function announceStuckLeft() {
    if (canAnnounce()) {
        lastAnnounceTime = input.runningTime()
        basic.showString("JUMI VAS")
        music.playTone(330, music.beat(BeatFraction.Quarter))
        basic.pause(60)
        music.playTone(330, music.beat(BeatFraction.Quarter))
        basic.pause(60)
        music.playTone(330, music.beat(BeatFraction.Quarter))
    }
}

function announceStuckRight() {
    if (canAnnounce()) {
        lastAnnounceTime = input.runningTime()
        basic.showString("JUMI OIK")
        music.playTone(330, music.beat(BeatFraction.Quarter))
        basic.pause(60)
        music.playTone(330, music.beat(BeatFraction.Quarter))
        basic.pause(60)
        music.playTone(330, music.beat(BeatFraction.Quarter))
    }
}

function chooseOpenTurn(deg: number, reason: string) {
    readFrontDistances()

    if (spaceScore(leftFront) > spaceScore(rightFront) + 40) {
        if (reason == "ESTE") {
            announceObstacleLeft()
        } else if (reason == "JUMI") {
            announceStuckLeft()
        }
        turnLeftDeg(deg)
    } else if (spaceScore(rightFront) > spaceScore(leftFront) + 40) {
        if (reason == "ESTE") {
            announceObstacleRight()
        } else if (reason == "JUMI") {
            announceStuckRight()
        }
        turnRightDeg(deg)
    } else {
        if (turnBias > 0) {
            if (reason == "ESTE") {
                announceObstacleRight()
            } else if (reason == "JUMI") {
                announceStuckRight()
            }
            turnRightDeg(deg)
            turnBias = -1
        } else {
            if (reason == "ESTE") {
                announceObstacleLeft()
            } else if (reason == "JUMI") {
                announceStuckLeft()
            }
            turnLeftDeg(deg)
            turnBias = 1
        }
    }
}

function obstacleEscape() {
    stopPidNow()
    basic.pause(60)

    maqueenPlusV2.pidControlDistance(
        maqueenPlusV2.SpeedDirection.SpeedCCW,
        BACKUP_CM,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
    basic.pause(60)

    chooseOpenTurn(NORMAL_TURN_DEG, "ESTE")
    basic.pause(60)
}

function stuckEscape() {
    stopPidNow()
    basic.pause(60)

    maqueenPlusV2.pidControlDistance(
        maqueenPlusV2.SpeedDirection.SpeedCCW,
        BACKUP_CM,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
    basic.pause(60)

    chooseOpenTurn(ESCAPE_TURN_DEG, "JUMI")
    basic.pause(60)
}

music.setBuiltInSpeakerEnabled(true)

maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(LIDAR_ADDR, matrixLidarDistance.Matrix.MAT)

// LiDAR tarvitsee noin 3 s käynnistyä
basic.pause(3500)

// Käynnistä heti ensimmäinen eteenajo
startForwardPid()

basic.forever(function () {
    let actionTaken = false

    readFrontDistances()

    leftSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Left)
    rightSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Right)

    if (isObstacle(centerFront, CENTER_OBSTACLE_MM) ||
        (isObstacle(leftFront, SIDE_OBSTACLE_MM) && isObstacle(rightFront, SIDE_OBSTACLE_MM))) {
        obstacleEscape()
        actionTaken = true
    }

    if (!actionTaken) {
        if (pidForwardActive) {
            if (input.runningTime() - forwardStartedAt > 700) {
                if (avgSpeed() <= STUCK_SPEED_CM_S) {
                    if (stuckSince == 0) {
                        stuckSince = input.runningTime()
                    }
                    if (input.runningTime() - stuckSince >= STUCK_TIME_MS) {
                        stuckEscape()
                        actionTaken = true
                    }
                } else {
                    stuckSince = 0
                }

                if (avgSpeed() <= FINISHED_SPEED_CM_S) {
                    if (almostStoppedSince == 0) {
                        almostStoppedSince = input.runningTime()
                    }
                    if (input.runningTime() - almostStoppedSince >= FINISHED_TIME_MS) {
                        pidForwardActive = false
                        almostStoppedSince = 0
                    }
                } else {
                    almostStoppedSince = 0
                }
            }
        }

        if (!pidForwardActive && !actionTaken) {
            startForwardPid()
        }
    }

    basic.pause(50)
})