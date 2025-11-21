import StepDirection from "./StepDirection";

export default interface NextStep {
    stepDirection: StepDirection,
    stepDestination: Phaser.Math.Vector2
}