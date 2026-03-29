let groundRef = 0
let groundNow = 0

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

let LIDAR_ADDR = matrixLidarDistance.Addr.Addr4

// Jos auto kääntyy väärään suuntaan, vaihda tämä arvo -1:ksi
let RIGHT_SIGN = 1

// Säädöt
let CLIFF_MARGIN_MM = 50
let SIDE_OBSTACLE_MM = 260
let CENTER_OBSTACLE_MM = 220

let FORWARD_SEGMENT_CM = 120
let BACKUP_CM = 15
let CLIFF_BACKUP_CM = 10

let SMALL_TURN_DEG = 25
let NORMAL_TURN_DEG = 95
let ESCAPE_TURN_DEG = 130

let STUCK_SPEED_CM_S = 2
let STUCK_TIME_MS = 3000
let FINISHED_SPEED_CM_S = 1
let FINISHED_TIME_MS = 400

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

function readCliffDistance() {
    groundNow = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, 3, 3)
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

function chooseOpenTurn(deg: number) {
    readFrontDistances()

    if (spaceScore(leftFront) > spaceScore(rightFront) + 40) {
        turnLeftDeg(deg)
    } else if (spaceScore(rightFront) > spaceScore(leftFront) + 40) {
        turnRightDeg(deg)
    } else {
        if (turnBias > 0) {
            turnRightDeg(deg)
            turnBias = -1
        } else {
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

    chooseOpenTurn(NORMAL_TURN_DEG)
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

    chooseOpenTurn(ESCAPE_TURN_DEG)
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
    basic.pause(60)

    if (turnBias > 0) {
        turnRightDeg(110)
        turnBias = -1
    } else {
        turnLeftDeg(110)
        turnBias = 1
    }

    basic.pause(60)
}

function calibrateGround() {
    let sum = 0
    let count = 0
    let d = 0

    // LiDAR tarvitsee noin 3 s käynnistyäkseen
    basic.pause(3500)

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

maqueenPlusV2.I2CInit()
matrixLidarDistance.initialize(LIDAR_ADDR, matrixLidarDistance.Matrix.MAT)
calibrateGround()

basic.forever(function () {
    let actionTaken = false

    readFrontDistances()
    readCliffDistance()

    leftSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Left)
    rightSpeed = maqueenPlusV2.readRealTimeSpeed(maqueenPlusV2.DirectionType2.Right)

    // 1) Rapun/pudotuksen tunnistus
    if (groundNow > 0 && groundNow > groundRef + CLIFF_MARGIN_MM) {
        cliffEscape()
        actionTaken = true

        // 2) Selkeä este suoraan edessä tai molemmilla puolilla
    } else if (isObstacle(centerFront, CENTER_OBSTACLE_MM) ||
        (isObstacle(leftFront, SIDE_OBSTACLE_MM) && isObstacle(rightFront, SIDE_OBSTACLE_MM))) {
        obstacleEscape()
        actionTaken = true

        // 3) Este vain vasemmalla -> pieni korjaus oikealle
    } else if (isObstacle(leftFront, SIDE_OBSTACLE_MM)) {
        stopPidNow()
        basic.pause(30)
        turnRightDeg(SMALL_TURN_DEG)
        basic.pause(30)
        actionTaken = true

        // 4) Este vain oikealla -> pieni korjaus vasemmalle
    } else if (isObstacle(rightFront, SIDE_OBSTACLE_MM)) {
        stopPidNow()
        basic.pause(30)
        turnLeftDeg(SMALL_TURN_DEG)
        basic.pause(30)
        actionTaken = true
    }

    if (!actionTaken) {
        if (pidForwardActive) {
            // Anna PID-ajolle hetki aikaa lähteä käyntiin
            if (input.runningTime() - forwardStartedAt > 700) {
                // Jumitunnistus: käsky päällä, mutta nopeus lähes nolla pitkään
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

                // Kun PID-segmentti on valmis, vapauta tila uutta eteenajoa varten
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