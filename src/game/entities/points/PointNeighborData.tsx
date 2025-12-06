export default interface PointNeighborData {
    neighborPointId: string,
    neighborPointCoords: Phaser.Math.Vector2,
    neighborPointAngleDegrees: number,
    neighborDx: number,
    neighborDy: number
}