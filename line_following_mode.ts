namespace LineFollowingMode {
    let lastTurn = 0

    export function init() {
        lastTurn = 0
    }

    export function step() {
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
}
