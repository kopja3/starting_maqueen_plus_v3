function spaceScore(dist: number) {
    if (dist > 0) {
        return dist
    } else {
        return 9999
    }
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

function announceCliff() {
    if (canAnnounce()) {
        lastAnnounceTime = input.runningTime()
        basic.showString("RAPUT")
        music.playTone(784, music.beat(BeatFraction.Quarter))
        basic.pause(80)
        music.playTone(784, music.beat(BeatFraction.Quarter))
    }
}

function isObstacle(dist: number, threshold: number) {
    return dist > 0 && dist < threshold
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
    lastPoseUpdateMs = input.runningTime()
    stuckSince = 0
    almostStoppedSince = 0
}

function startMeasurement() {
    stopPidNow()
    resetMeasurementState()
    lastMeasuredAreaM2 = 0
    measuring = true
    basic.showString("GO")
    startForwardPid()
}

function finishMeasurement() {
    stopPidNow()
    measuring = false
    lastMeasuredAreaM2 = roundedAreaM2()
    basic.showString("STOP")
    playSOS()
    basic.showString("" + lastMeasuredAreaM2 + "m2")
}

function showAreaNow() {
    area = roundedAreaM2()
    basic.showString("" + area + "m2")
}

function playSOS() {
    for (let i = 0; i < 3; i++) {
        music.playTone(784, 150)
        basic.pause(80)
    }
    basic.pause(120)
    for (let i = 0; i < 3; i++) {
        music.playTone(784, 450)
        basic.pause(120)
    }
    basic.pause(120)
    for (let i = 0; i < 3; i++) {
        music.playTone(784, 150)
        basic.pause(80)
    }
}

function degToRad(d: number) {
    return d * Math.PI / 180
}

function wrapDeg(d: number) {
    while (d >= 180) {
        d += -360
    }
    while (d < -180) {
        d += 360
    }
    return d
}

function turnLeftDeg(deg: number) {
    maqueenPlusV2.pidControlAngle(
        (0 - RIGHT_SIGN) * deg,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
    headingDeg = wrapDeg(headingDeg - deg)
    turnBias = 1
}

function turnRightDeg(deg: number) {
    maqueenPlusV2.pidControlAngle(
        RIGHT_SIGN * deg,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
    headingDeg = wrapDeg(headingDeg + deg)
    turnBias = -1
}

function readFrontDistances() {
    leftFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 0, 2)
    centerFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 3, 2)
    rightFront = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 7, 2)
}

function readCliffDistance() {
    groundNow = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 3, 3)
}

function cliffDetected() {
    if (groundNow > 0 && groundNow > groundRef + CLIFF_MARGIN_MM) {
        cliffDetectCount += 1
    } else {
        cliffDetectCount = 0
    }
    return cliffDetectCount >= CLIFF_CONFIRM_FRAMES
}

function calibrateGround() {
    sum = 0
    count = 0
    for (let i = 0; i < 8; i++) {
        d = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 3, 3)
        if (d > 0) {
            sum += d
            count += 1
        }
        basic.pause(30)
    }
    if (count > 0) {
        groundRef = sum / count
    } else {
        groundRef = 120
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
        } else {
            if (reason == "ESTE") {
                announceObstacleLeft()
            } else if (reason == "JUMI") {
                announceStuckLeft()
            }
            turnLeftDeg(deg)
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
    advancePoseByCm(0 - BACKUP_CM)
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
    advancePoseByCm(0 - BACKUP_CM)
    basic.pause(60)
    chooseOpenTurn(ESCAPE_TURN_DEG, "JUMI")
    basic.pause(60)
}

function cliffEscape() {
    stopPidNow()
    basic.pause(60)
    maqueenPlusV2.pidControlDistance(
        maqueenPlusV2.SpeedDirection.SpeedCCW,
        CLIFF_BACKUP_CM,
        maqueenPlusV2.MyInterruption.NotAllowed
    )
    advancePoseByCm(0 - CLIFF_BACKUP_CM)
    basic.pause(60)
    announceCliff()

    readFrontDistances()
    if (spaceScore(leftFront) > spaceScore(rightFront) + 40) {
        turnLeftDeg(CLIFF_TURN_DEG)
    } else if (spaceScore(rightFront) > spaceScore(leftFront) + 40) {
        turnRightDeg(CLIFF_TURN_DEG)
    } else {
        if (turnBias > 0) {
            turnRightDeg(CLIFF_TURN_DEG)
        } else {
            turnLeftDeg(CLIFF_TURN_DEG)
        }
    }

    basic.pause(60)
    cliffHoldUntil = input.runningTime() + CLIFF_HOLD_MS
}

function cellIndex(cx: number, cy: number) {
    if (cx < 0 || cy < 0 || cx >= MAP_W || cy >= MAP_H) {
        return -1
    }
    return cy * MAP_W + cx
}

function initMap() {
    visited = []
    for (let i = 0; i < MAP_W * MAP_H; i++) {
        visited.push(0)
    }
}

function markCellByCm(px: number, py: number) {
    cx = Math.floor(px / CELL_CM)
    cy = Math.floor(py / CELL_CM)
    idx = cellIndex(cx, cy)
    if (idx >= 0 && visited[idx] == 0) {
        visited[idx] = 1
        coveredCells += 1
    }
}

function markRobotFootprint(px: number, py: number) {
    // Kevyempi merkintä: keskikohta + neljä suuntaa
    markCellByCm(px, py)
    markCellByCm(px + ROBOT_WIDTH_CM / 2, py)
    markCellByCm(px - ROBOT_WIDTH_CM / 2, py)
    markCellByCm(px, py + ROBOT_WIDTH_CM / 2)
    markCellByCm(px, py - ROBOT_WIDTH_CM / 2)
}

function coveredAreaM2() {
    return coveredCells * CELL_CM * CELL_CM / 10000
}

function roundedAreaM2() {
    return Math.round(coveredAreaM2() * 100) / 100
}

function resetMeasurementState() {
    coveredCells = 0
    initMap()
    xCm = MAP_W * CELL_CM / 2
    yCm = MAP_H * CELL_CM / 2
    headingDeg = 0
    cliffDetectCount = 0
    cliffHoldUntil = 0
    stuckSince = 0
    almostStoppedSince = 0
    pidForwardActive = false
    lastPoseUpdateMs = input.runningTime()
    markRobotFootprint(xCm, yCm)
}

function avgSpeed() {
    return (Math.abs(leftSpeed) + Math.abs(rightSpeed)) / 2
}

function advancePoseByCm(cm: number) {
    headingRad = degToRad(headingDeg)
    xCm += cm * Math.cos(headingRad)
    yCm += cm * Math.sin(headingRad)
    markRobotFootprint(xCm, yCm)
}

function updatePoseFromSpeed() {
    now = input.runningTime()
    dtMs = now - lastPoseUpdateMs
    if (dtMs <= 0) {
        lastPoseUpdateMs = now
        return
    }
    lastPoseUpdateMs = now

    speedCmPerS = avgSpeed()
    dCm = speedCmPerS * dtMs / 1000

    if (pidForwardActive) {
        advancePoseByCm(dCm)
    }
}

input.onButtonPressed(Button.A, function () {
    if (measuring) {
        showAreaNow()
    } else {
        basic.showString("" + lastMeasuredAreaM2 + "m2")
    }
})

input.onButtonPressed(Button.B, function () {
    if (!(measuring)) {
        startMeasurement()
    } else {
        finishMeasurement()
    }
})

let actionTaken = false
let rightSpeed = 0
let leftSpeed = 0
let dCm = 0
let speedCmPerS = 0
let dtMs = 0
let now = 0
let idx = 0
let cy = 0
let cx = 0
let cliffDetectCount = 0
let cliffHoldUntil = 0
let headingRad = 0
let forwardStartedAt = 0
let groundRef = 0
let count = 0
let sum = 0
let visited: number[] = []
let coveredCells = 0
let almostStoppedSince = 0
let stuckSince = 0
let pidForwardActive = false
let area = 0
let measuring = false
let lastMeasuredAreaM2 = 0
let lastAnnounceTime = 0
let lastPoseUpdateMs = 0
let headingDeg = 0
let yCm = 0
let xCm = 0
let ROBOT_WIDTH_CM = 0
let MAP_H = 0
let MAP_W = 0
let CELL_CM = 0
let CLIFF_TURN_DEG = 0
let ESCAPE_TURN_DEG = 0
let NORMAL_TURN_DEG = 0
let CLIFF_BACKUP_CM = 0
let BACKUP_CM = 0
let FORWARD_SEGMENT_CM = 0
let CLIFF_CONFIRM_FRAMES = 0
let CLIFF_MARGIN_MM = 0
let RIGHT_SIGN = 0
let CLIFF_HOLD_MS = 0
let ANNOUNCE_COOLDOWN_MS = 0
let turnBias = 0
let groundNow = 0
let rightFront = 0
let centerFront = 0
let leftFront = 0
let d = 0

turnBias = 1
ANNOUNCE_COOLDOWN_MS = 1500
CLIFF_HOLD_MS = 1200

const LIDAR_ADDR = matrixLidarDistance.Addr.Addr4

RIGHT_SIGN = 1

let SIDE_OBSTACLE_MM = 260
let CENTER_OBSTACLE_MM = 220

CLIFF_MARGIN_MM = 60
CLIFF_CONFIRM_FRAMES = 3

FORWARD_SEGMENT_CM = 120
BACKUP_CM = 15
CLIFF_BACKUP_CM = 10
NORMAL_TURN_DEG = 95
ESCAPE_TURN_DEG = 130
CLIFF_TURN_DEG = 25

let STUCK_SPEED_CM_S = 2
let STUCK_TIME_MS = 3000
let FINISHED_SPEED_CM_S = 1
let FINISHED_TIME_MS = 400

// KEVENNETTY KARTTA x022-virheen välttämiseksi
CELL_CM = 20
MAP_W = 30
MAP_H = 30
ROBOT_WIDTH_CM = 11

music.setBuiltInSpeakerEnabled(true)
maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(LIDAR_ADDR, matrixLidarDistance.Matrix.MAT)

basic.pause(3500)

calibrateGround()
initMap()

xCm = MAP_W * CELL_CM / 2
yCm = MAP_H * CELL_CM / 2
headingDeg = 0
lastPoseUpdateMs = input.runningTime()
markRobotFootprint(xCm, yCm)

basic.showString("VALMIS")

if (ACTIVE_MODE == ProgramMode.LaserShuttle) {
    LaserShuttleMode.init()
} else {
    LineFollowingMode.init()
}

showSelectedMode()

basic.forever(function () {
    if (!(measuring)) {
        basic.pause(100)
        return
    }

    // Tämä pitää nollata joka kierroksella
    actionTaken = false

    leftSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Left)
    rightSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Right)

    updatePoseFromSpeed()
    readFrontDistances()
    readCliffDistance()

    if (cliffDetected()) {
        cliffEscape()
        actionTaken = true
    }

    if (!(actionTaken)) {
        // Väistä jos mikä tahansa etuanturi näkee esteen
        if (isObstacle(centerFront, CENTER_OBSTACLE_MM) ||
            isObstacle(leftFront, SIDE_OBSTACLE_MM) ||
            isObstacle(rightFront, SIDE_OBSTACLE_MM)) {
            obstacleEscape()
            actionTaken = true
        }
    }

    if (!(actionTaken)) {
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

        if (!(pidForwardActive) && !(actionTaken)) {
            if (input.runningTime() >= cliffHoldUntil) {
                startForwardPid()
            }
        }
    }

    basic.pause(50)
})
