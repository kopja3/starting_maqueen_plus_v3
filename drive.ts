namespace Drive {
    export const BASE_SPEED = 70
    export const TURN_FAST = 110
    export const TURN_SLOW = 20

    export function stop() {
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

    export function goStraight() {
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

    export function turnLeftSoft() {
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
    }

    export function turnRightSoft() {
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
    }

    export function spinTurnAround(ms: number) {
        stop()
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

        basic.pause(ms)
        stop()
        basic.pause(120)
    }
}
