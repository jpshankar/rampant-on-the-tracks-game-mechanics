import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";
import PointType from "@/game/entities/points/PointType";

function determineGridPointImage(pointType: PointType): string {
    switch (pointType) {
        case PointType.Default: return "grid_point";
        case PointType.Destination: return "walker_destination";
        case PointType.Block: return "grid_point_blocked";
        case PointType.RedirectNorth: return "grid_point_redirect_north";
        case PointType.RedirectEast: return "grid_point_redirect_east";
        case PointType.RedirectSouth: return "grid_point_redirect_south";
        case PointType.RedirectWest: return "grid_point_redirect_west";
    } 
}

export default class Point extends Phaser.Physics.Arcade.Image {
    colInd: number;
    rowInd: number;

    pointType: PointType;

    constructor(scene: GameMechanicsDemo, colInd: number, rowInd: number, xCoord: number, yCoord: number, pointType: PointType) {
        super(scene, xCoord, yCoord, determineGridPointImage(pointType));

        this.colInd = colInd;
        this.rowInd = rowInd;

        this.pointType = pointType;
    }
}