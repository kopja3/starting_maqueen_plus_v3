namespace LaserShuttleMode {
    const LIDAR_ADDR = matrixLidarDistance.Addr.Addr4
    const TURN_AROUND_MS = 560
    const LASER_THRESHOLD_MM = 380
    const LASER_X = 3
    const LASER_Y = 6

    let reverseMode = false
    let lastTurn = 0

    export function init() {
        reverseMode = false
        lastTurn = 0
        matrixLidarDistance.initialize(LIDAR_ADDR, matrixLidarDistance.Matrix.MAT)
        basic.showString("LIDAR")
        basic.pause(3500)
    }

    export function toggleReverseMode() {
        reverseMode = !reverseMode
        Drive.stop()
        if (reverseMode) {
            basic.showString("REV")
        } else {
            basic.showString("FWD")
        }
    }

    function obstacleAhead(): boolean {
        let centerMm = matrixLidarDistance.matrixPointOutput(LIDAR_ADDR, LASER_X, LASER_Y)
        return centerMm > 0 && centerMm < LASER_THRESHOLD_MM
    }

    function followForward() {
        let left = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorL1)
        let middle = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorM)
        let right = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorR1)

        if (middle == 1 && left == 0 && right == 0) {
            Drive.goStraight()
        } else if (left == 1 && right == 0) {
            Drive.turnLeftSoft()
            lastTurn = -1
        } else if (right == 1 && left == 0) {
            Drive.turnRightSoft()
            lastTurn = 1
        } else if (left == 1 && middle == 1 && right == 0) {
            Drive.turnLeftSoft()
            lastTurn = -1
        } else if (right == 1 && middle == 1 && left == 0) {
            Drive.turnRightSoft()
            lastTurn = 1
        } else if (left == 1 && middle == 1 && right == 1) {
            Drive.goStraight()
        } else {
            if (lastTurn < 0) {
                Drive.turnLeftSoft()
            } else if (lastTurn > 0) {
                Drive.turnRightSoft()
            } else {
                Drive.stop()
            }
        }
    }

    function followBackward() {
        let left = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorL1)
        let middle = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorM)
        let right = maqueenPlusV2.readLineSensorState(maqueenPlusV2.MyEnumLineSensor.SensorR1)

        if (middle == 1 && left == 0 && right == 0) {
            Drive.goStraight()
        } else if (left == 1 && right == 0) {
            Drive.turnRightSoft()
            lastTurn = 1
        } else if (right == 1 && left == 0) {
            Drive.turnLeftSoft()
            lastTurn = -1
        } else if (left == 1 && middle == 1 && right == 0) {
            Drive.turnRightSoft()
            lastTurn = 1
        } else if (right == 1 && middle == 1 && left == 0) {
            Drive.turnLeftSoft()
            lastTurn = -1
        } else if (left == 1 && middle == 1 && right == 1) {
            Drive.goStraight()
        } else {
            if (lastTurn < 0) {
                Drive.turnLeftSoft()
            } else if (lastTurn > 0) {
                Drive.turnRightSoft()
            } else {
                Drive.stop()
            }
        }
    }

    export function step() {
        if (obstacleAhead()) {
            Drive.spinTurnAround(TURN_AROUND_MS)
            reverseMode = !reverseMode
            return
        }

        if (reverseMode) {
            followBackward()
        } else {
            followForward()
        }
    }
}
