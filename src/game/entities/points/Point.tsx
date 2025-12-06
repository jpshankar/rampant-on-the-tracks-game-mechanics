import GameMechanicsDemo from "@/game/scenes/GameMechanicsDemo";
import PointType from "@/game/entities/points/PointType";
import PointNeighborData from "./PointNeighborData";

function determineGridPointImage(pointType: PointType): string {
    switch (pointType) {
        case PointType.Default: return "grid_point";
        case PointType.Destination: return "walker_destination";
        case PointType.Block: return "grid_point_blocked";
        case PointType.Redirect: return "grid_point_redirect";
    } 
}

export default class Point extends Phaser.Physics.Arcade.Image {
    pointId: string;
    pointType: PointType;
    
    // Storing Redireact-specific info directly on the Point for now.
    redirectionDestinations: PointNeighborData[] = [];

    redirectionLineGraphics: Phaser.GameObjects.Graphics;
    redirectionLine: Phaser.Geom.Line;

    constructor(scene: GameMechanicsDemo, xCoord: number, yCoord: number, pointId: string, pointType: PointType) {
        super(scene, xCoord, yCoord, determineGridPointImage(pointType));
        
        this.pointId = pointId;
        this.pointType = pointType;
    }

    destroyRedirectionLineIfWasCreated() {
        if (this.redirectionLine) {
            this.redirectionLineGraphics.destroy();
        }
    }

    updateRedirectionLine(toCoords: Phaser.Math.Vector2) {
        this.destroyRedirectionLineIfWasCreated();

        this.redirectionLine = new Phaser.Geom.Line(this.x, this.y, toCoords.x, toCoords.y);
        this.redirectionLineGraphics = this.scene.add.graphics({ lineStyle: {width: 1, color: 0xffd000 } });

        this.redirectionLineGraphics.strokeLineShape(this.redirectionLine);
    }

}